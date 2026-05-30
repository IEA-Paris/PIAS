/* global CMS, createClass, h, require */

/**
 * PIAS custom CMS widgets — citation picker + footnote inserter.
 *
 * Loaded as a plain script after decap-cms.js (which exposes the `CMS`,
 * `createClass` and `h` globals) and after the citation-js browser bundle
 * (which exposes a CommonJS-style `require`). No build step runs on this file.
 *
 * Both tools are registered as *editor components*: DecapCMS surfaces them in
 * the markdown editor's "Add Component" (+) menu, and inserts their output as a
 * block. The emitted tokens — `@key` for citations, `[^n]` / `[^n]: …` for
 * footnotes — are plain markdown and are resolved downstream by publio
 * (modules/publio/lib/article/body/{insertCitationKeys,insertBibliographicalReferences,insertFootnotes}.js),
 * which walk text nodes regardless of block boundaries.
 */
;(function () {
  // citation-js — same 0.5.7 engine as the server-side build, so the keys we
  // list here are exactly the `item.id`s publio resolves against.
  let Cite = null
  try {
    const mod = require('citation-js')
    Cite = mod && mod.default ? mod.default : mod
  } catch (e) {
    // Surfaced in the picker UI; citation insertion is unavailable without it.
    console.error('citation-js failed to load; citation picker disabled', e)
  }

  // --- bibliography loading & parsing -------------------------------------

  // Resolve the public URL of the article's bib file. The `bibliography` field
  // (see scripts/configCMS.mjs) stores a site-root-relative path like
  // "/bibliography/<slug>/file.bib"; the admin app is served from the same
  // origin, so the path is fetchable as-is.
  const bibCache = {}
  function loadBibliography(bibPath) {
    if (!bibPath) return Promise.resolve(null)
    if (bibCache[bibPath]) return bibCache[bibPath]
    const url = bibPath.charAt(0) === '/' ? bibPath : '/' + bibPath
    const p = fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url)
        return res.text()
      })
      .then(function (text) {
        if (!Cite) throw new Error('citation-js unavailable')
        const cite = new Cite(text)
        return (cite.data || []).map(function (item) {
          let author = ''
          if (item.author && item.author.length) {
            author = item.author[0].family || item.author[0].literal || ''
            if (item.author.length > 1) author += ' et al.'
          }
          let year = ''
          const parts = item.issued && item.issued['date-parts']
          if (parts && parts[0] && parts[0][0] != null) {
            year = String(parts[0][0])
          }
          return {
            key: item.id,
            author,
            year,
            title: item.title || '',
          }
        })
      })
    bibCache[bibPath] = p
    return p
  }

  // --- bibPicker widget (used as the citation component's only field) ------

  const BibPickerControl = createClass({
    getInitialState() {
      return { entries: null, error: null, query: '' }
    },

    componentDidMount() {
      const entry = this.props.entry
      // Read the sibling `bibliography` field off the current entry.
      const bibPath = entry && entry.getIn(['data', 'bibliography'])
      this.bibPath = bibPath
      if (!bibPath) return
      const self = this
      loadBibliography(bibPath)
        .then(function (entries) {
          self.setState({ entries })
        })
        .catch(function (err) {
          self.setState({ error: err.message })
        })
    },

    select(key) {
      this.props.onChange(key)
    },

    render() {
      const self = this
      const value = this.props.value
      const s = this.state

      if (!this.bibPath) {
        return h(
          'div',
          { className: this.props.classNameWrapper },
          h(
            'p',
            {
              style: {
                color: '#798291',
                fontStyle: 'italic',
                padding: '8px 0',
              },
            },
            'No bibliography file is attached to this article. Add one in the ' +
              '"Bibliography" field to enable citation insertion.'
          )
        )
      }
      if (s.error) {
        return h(
          'div',
          { className: this.props.classNameWrapper },
          h(
            'p',
            { style: { color: '#ff003f', padding: '8px 0' } },
            'Could not load the bibliography: ' + s.error
          )
        )
      }
      if (!s.entries) {
        return h(
          'div',
          { className: this.props.classNameWrapper },
          h('p', { style: { padding: '8px 0' } }, 'Loading bibliography…')
        )
      }

      const q = s.query.toLowerCase()
      const filtered = s.entries.filter(function (e) {
        if (!q) return true
        return (e.key + ' ' + e.author + ' ' + e.year + ' ' + e.title)
          .toLowerCase()
          .includes(q)
      })

      return h(
        'div',
        { className: this.props.classNameWrapper, style: { padding: '4px 0' } },
        value &&
          h(
            'p',
            { style: { margin: '0 0 8px' } },
            'Selected: ',
            h('strong', {}, '@' + value)
          ),
        h('input', {
          type: 'text',
          placeholder: 'Search author, year, title or key…',
          value: s.query,
          onChange(e) {
            self.setState({ query: e.target.value })
          },
          style: {
            width: '100%',
            padding: '8px',
            marginBottom: '8px',
            border: '1px solid #dfdfe3',
            borderRadius: '4px',
            boxSizing: 'border-box',
          },
        }),
        h(
          'div',
          {
            style: {
              maxHeight: '260px',
              overflowY: 'auto',
              border: '1px solid #dfdfe3',
              borderRadius: '4px',
            },
          },
          filtered.length === 0
            ? h(
                'p',
                { style: { padding: '8px', color: '#798291' } },
                'No matching references.'
              )
            : filtered.map(function (e) {
                const selected = e.key === value
                return h(
                  'div',
                  {
                    key: e.key,
                    onClick() {
                      self.select(e.key)
                    },
                    style: {
                      padding: '8px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f1f4',
                      background: selected ? '#e8f0fe' : 'transparent',
                    },
                  },
                  h(
                    'div',
                    { style: { fontWeight: 600 } },
                    (e.author || '—') + (e.year ? ' (' + e.year + ')' : '')
                  ),
                  h(
                    'div',
                    { style: { fontSize: '0.85em', color: '#5e6472' } },
                    e.title
                  ),
                  h(
                    'code',
                    { style: { fontSize: '0.8em', color: '#798291' } },
                    '@' + e.key
                  )
                )
              })
        )
      )
    },
  })

  CMS.registerWidget('bibPicker', BibPickerControl)

  // --- citation editor component ------------------------------------------

  CMS.registerEditorComponent({
    id: 'citation',
    label: 'Citation',
    fields: [{ name: 'key', label: 'Reference', widget: 'bibPicker' }],
    // A block that is exactly a single `@key` token. Re-opening such a block
    // shows the picker again. Key charset mirrors utils/referenceRegex.js
    // (alphanumerics, _, -, accents) — we keep it permissive and let the
    // downstream lookup validate.
    pattern: /^@([^\s@()[\];,.*]+)$/,
    fromBlock(match) {
      return { key: match[1] }
    },
    toBlock(data) {
      return data.key ? '@' + data.key : ''
    },
    toPreview(data) {
      if (!data.key) return ''
      return (
        '<span style="display:inline-block;background:#e8f0fe;color:#1a56db;' +
        'border-radius:10px;padding:1px 8px;font-size:0.9em;">@' +
        data.key +
        '</span>'
      )
    },
  })

  // --- footnotes ----------------------------------------------------------
  //
  // Markdown shape (what publio's insertFootnotes.js consumes):
  //   * inline marker `[^N]` in the prose, and
  //   * a definition line `[^N]: text` — all definitions grouped at the very
  //     end of the document, one per line, numbered 1..N in reading order.
  //
  // DecapCMS editor components are block-level and round-trip *plain markdown*
  // reliably (HTML comments do NOT survive — they leak verbatim and can break
  // the GitHub persist, so we never emit HTML). The Footnote component therefore
  // emits a plain-markdown pair at the cursor:
  //
  //     [^fnXXXX]
  //
  //     [^fnXXXX]: the footnote text
  //
  // using a temporary *string id* (`fnXXXX`) so two freshly-inserted footnotes
  // never collide before they are numbered. On save, normalizeFootnotes():
  //   1. renumbers every marker to 1..N by reading order (so a footnote inserted
  //      after `[^3]` becomes `[^4]` and the rest shift up), and
  //   2. moves every definition to the document end, one per line.
  // The string-id form only ever exists in the unsaved draft; the committed
  // markdown is always clean numeric `[^N]` + end `[^N]: text`.

  // Markers/definitions may be numeric (`[^3]`) or carry a temporary string id
  // (`[^fnA1B2]`) while editing. The Slate serializer may escape the brackets as
  // `\[^..\]` — the reason the build ships formattingFixes.js — so we tolerate
  // and strip the backslashes, always emitting the clean form.
  const LABEL = '(\\d+|fn[0-9a-z]+)'
  const MARKER_RE = new RegExp('\\\\?\\[\\^' + LABEL + '\\\\?\\]', 'gi')
  const DEF_RE = new RegExp(
    '^\\\\?\\[\\^' +
      LABEL +
      '\\\\?\\]:[ \\t]*(.*(?:\\n(?!\\\\?\\[\\^' +
      LABEL +
      '\\\\?\\]:|\\s*$)[^\\n]*)*)',
    'gmi'
  )

  let fnCounter = 0
  function nextFootnoteId() {
    fnCounter += 1
    // letters+digits, never a bare number → never collides with a real `[^3]`.
    return 'fn' + fnCounter.toString(36) + 'x'
  }

  /**
   * Normalise every footnote in `markdown`:
   *   1. Pull out all definitions (`[^label]: text`), keyed by label.
   *   2. Walk the inline markers in reading order; assign each label 1..N.
   *   3. Rewrite markers to their numbers (first occurrence wins; drop dups).
   *   4. Re-emit definitions at the document end, one per line, sorted by number.
   * Idempotent. Definitions whose marker no longer appears are dropped.
   */
  function normalizeFootnotes(markdown) {
    if (!markdown) return markdown

    // 1. Collect + strip definitions. Keys are lower-cased so a marker and its
    //    definition match even if the serializer changed the id's case. FIRST
    //    definition for a label wins: when a footnote is re-edited, toBlock emits
    //    the fresh `[^id]: new text` *before* the stale end-definition, so the
    //    fresh one is seen first and the stale one is dropped.
    const defs = {}
    let body = markdown.replace(DEF_RE, function (whole, label, text) {
      const key = label.toLowerCase()
      if (defs[key] == null) defs[key] = (text || '').replace(/\s+$/, '')
      return ''
    })

    // 2. Reading order of inline markers (keyed by lower-cased label).
    const order = []
    const seen = {}
    let m
    MARKER_RE.lastIndex = 0
    while ((m = MARKER_RE.exec(body)) !== null) {
      const key = m[1].toLowerCase()
      if (!seen[key]) {
        seen[key] = true
        order.push(key)
      }
    }
    if (order.length === 0) {
      return body.replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n'
    }

    const newNumber = {}
    order.forEach(function (key, i) {
      newNumber[key] = i + 1
    })

    // 3. Rewrite markers; keep only first occurrence of each label.
    const emitted = {}
    body = body.replace(MARKER_RE, function (whole, label) {
      const key = label.toLowerCase()
      if (newNumber[key] == null) return whole
      if (emitted[key]) return ''
      emitted[key] = true
      return '[^' + newNumber[key] + ']'
    })

    // 4. Tidy whitespace left behind.
    body = body
      .replace(/^[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+$/, '')

    // 5. Definitions at the end, one per line, sorted by new number.
    const defBlock = order
      .map(function (key) {
        return (
          '[^' + newNumber[key] + ']: ' + (defs[key] != null ? defs[key] : '')
        )
      })
      .join('\n')

    return body + '\n\n' + defBlock + '\n'
  }

  // Expose for testing / reuse.
  if (typeof window !== 'undefined') {
    window.normalizeFootnotes = normalizeFootnotes
  }

  CMS.registerEditorComponent({
    id: 'footnote',
    label: 'Footnote',
    fields: [
      { name: 'id', label: 'id', widget: 'hidden' },
      { name: 'number', label: 'Number (auto)', widget: 'hidden' },
      { name: 'content', label: 'Footnote text', widget: 'text' },
    ],
    // Match the plain-markdown pair `[^label]\n[^label]: text` (the form toBlock
    // emits and the form a freshly-inserted footnote has before save). One or two
    // newlines between marker and definition are both accepted.
    pattern: new RegExp(
      '^\\\\?\\[\\^' +
        LABEL +
        '\\\\?\\]\\n\\n?\\\\?\\[\\^\\1\\\\?\\]:[ \\t]*([\\s\\S]*)$'
    ),
    fromBlock(match) {
      const label = match[1]
      return {
        id: label,
        number: /^\d+$/.test(label) ? label : '',
        content: match[2] || '',
      }
    },
    toBlock(data) {
      // Use the existing numeric label if this footnote already has one,
      // otherwise a fresh string id. normalizeFootnotes() does final numbering.
      // Single newline (not a blank line) between marker and definition keeps the
      // inserted block compact; normalize relocates the definition to the end on
      // save anyway.
      const label = data.number || data.id || nextFootnoteId()
      return '[^' + label + ']\n[^' + label + ']: ' + (data.content || '')
    },
    toPreview(data) {
      const n = data.number || '•'
      const safe = String(data.content || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;')
      return (
        '<span style="display:inline-block;background:#e6f4ea;color:#137333;' +
        'border-radius:10px;padding:0 8px;font-size:0.9em;" title="' +
        safe.slice(0, 200) +
        '">footnote ' +
        n +
        '</span>'
      )
    },
  })

  // Renumber markers + group definitions at the document end on every save.
  // CRITICAL: a preSave handler must ALWAYS return a valid Immutable data map —
  // returning `undefined` wipes the entry (incl. the identifier_field) and the
  // GitHub backend then rejects the persist with a 422 (decap issue #6775).
  if (CMS.registerEventListener) {
    CMS.registerEventListener({
      name: 'preSave',
      handler(payload) {
        const entry =
          payload && payload.entry && payload.entry.get
            ? payload.entry
            : payload
        const data = entry && entry.get && entry.get('data')
        if (!data || !data.get) return data // nothing we can safely change
        try {
          const body = data.get('body')
          if (typeof body !== 'string' || !body.includes('[^')) return data
          return data.set('body', normalizeFootnotes(body))
        } catch (e) {
          console.error(
            '[PIAS footnotes] preSave error; leaving body unchanged',
            e
          )
          return data
        }
      },
    })
  }
})()
