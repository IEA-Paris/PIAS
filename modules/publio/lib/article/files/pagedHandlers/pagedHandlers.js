/*
 * Paged.js browser-side handlers for Publio article PDFs.
 *
 * This file is injected verbatim into the print page by pagedjs-cli
 * (`additionalScripts`), so it runs in the browser AFTER the paged.js polyfill
 * has defined the global `Paged` object but BEFORE pagination starts. It must be
 * plain browser JS (no imports/exports) and rely only on `window.Paged`.
 *
 * It registers three handlers, all keyed off `beforeParsed` (which receives the
 * full source DOM before it is fragmented into pages):
 *
 *   1. tocHandler        — fills the cover/TOC <nav class="pdf-toc"> with one
 *                          entry per body heading. CSS then resolves the page
 *                          number for each entry via target-counter(attr(href)).
 *   2. footnoteHandler   — relocates each end-of-document footnote body inline,
 *                          next to its in-text call, wrapped in
 *                          <span class="footnote">, so the CSS `float: footnote`
 *                          rule turns them into real bottom-of-page notes.
 *                          Self-disabling: if the markup can't be matched with
 *                          confidence it leaves the end section untouched
 *                          (the approved fallback).
 *   3. linkHandler       — inserts soft word-break opportunities into long URLs
 *                          so they don't overflow the justified text column.
 *   4. coverFitHandler   — shrinks the abstract font on the cover just enough
 *                          for the whole cover to fit on a single page, so a
 *                          long abstract keeps its full text without spilling.
 *
 * Guarded so a failure in any one handler can never abort pagination.
 */
;(function () {
  if (typeof window === 'undefined' || !window.Paged) {
    // Not in a paged.js context — nothing to do.
    return
  }

  const Paged = window.Paged

  /* ----------------------------------------------------------------------- *
   * 1. Table of contents
   * ----------------------------------------------------------------------- */
  class TocHandler extends Paged.Handler {
    beforeParsed(content) {
      try {
        const nav = content.querySelector('.pdf-toc')
        if (!nav) return // no TOC placeholder on this page

        // Only headings inside the article body, so cover/section headings
        // (Abstract, Bibliography, Footnotes labels) don't pollute the TOC.
        const body = content.querySelector('.article-body')
        if (!body) return

        const headings = Array.from(body.querySelectorAll('h2, h3'))
        if (!headings.length) {
          // Nothing to list — hide the whole TOC block so we don't print an
          // empty "Contents" heading.
          const block = content.querySelector('.pdf-toc-block')
          if (block) block.style.display = 'none'
          return
        }

        const list = document.createElement('ol')
        list.className = 'pdf-toc-list'

        headings.forEach((heading, index) => {
          // @nuxt/content slugifies headings to ids that can start with a digit
          // (e.g. "1-foundations"). `#1-foundations` is an INVALID CSS selector,
          // which crashes paged.js's target-counter(attr(href)) resolver. So we
          // force every linked heading to a CSS-safe id and link to that.
          const safeId = 'pdf-h-' + index
          heading.id = safeId

          const level = heading.tagName.toLowerCase() // h2 | h3
          const li = document.createElement('li')
          li.className = 'pdf-toc-item pdf-toc-' + level

          const a = document.createElement('a')
          a.href = '#' + safeId

          // Title text (strip inline markup) + dotted leader + page number.
          // The page number itself is filled by CSS via target-counter on
          // a::after; we add the label and a leader span here.
          const label = document.createElement('span')
          label.className = 'pdf-toc-label'
          label.textContent = heading.textContent.trim()

          const dots = document.createElement('span')
          dots.className = 'pdf-toc-dots'

          a.appendChild(label)
          a.appendChild(dots)
          li.appendChild(a)
          list.appendChild(li)
        })

        nav.appendChild(list)
      } catch (e) {
        // Never let TOC generation break the document.
        console.warn('[pagedHandlers] TOC handler skipped:', e && e.message)
      }
    }
  }

  /* ----------------------------------------------------------------------- *
   * 2. Footnotes — relocate end notes inline for `float: footnote`
   *
   * Remark / @nuxt/content emits, in the body:
   *   …text<sup class="footnote-ref"><a href="#fn1" id="fnref1">[1]</a></sup>…
   * and a trailing section:
   *   <section class="footnotes"><ol><li id="fn1"><p>note…<a href="#fnref1">↩</a></p></li>…</ol></section>
   *
   * Our pipeline additionally renders a separate ".pdf-footnotes" block from
   * `item.footnotes`. We detect whichever inline-call → note-body mapping is
   * present and move the note body inline. If neither is confidently matched,
   * we bail and leave the end section as the visible fallback.
   * ----------------------------------------------------------------------- */
  class FootnoteHandler extends Paged.Handler {
    beforeParsed(content) {
      try {
        if (!content.querySelector('.use-inline-footnotes')) {
          // Inline footnotes not requested for this document.
          return
        }

        const body = content.querySelector('.article-body')
        if (!body) return

        // Find in-text footnote calls. Support the common remark shapes.
        const calls = Array.from(
          body.querySelectorAll(
            'sup.footnote-ref > a[href^="#fn"], a.footnote-ref[href^="#fn"], sup > a[href^="#fn"]'
          )
        )
        if (!calls.length) return // nothing to relocate; keep fallback

        let moved = 0
        calls.forEach((call) => {
          const href = call.getAttribute('href') // e.g. #fn1
          if (!href) return
          const noteId = href.slice(1)
          // The note body lives anywhere in the document under that id.
          const noteEl = content.getElementById(noteId)
          if (!noteEl) return

          // Build the inline footnote span from the note body's content,
          // stripping the back-reference arrow link remark adds.
          const span = document.createElement('span')
          span.className = 'footnote'

          const clone = noteEl.cloneNode(true)
          clone
            .querySelectorAll('a[href^="#fnref"], .footnote-backref')
            .forEach((back) => back.remove())

          // Use the note's inner content (unwrap the <li>/<p> wrapper).
          span.innerHTML = clone.innerHTML.trim()

          // Replace the visible call marker (the <sup>) with the inline note.
          // paged.js generates the ::footnote-call marker itself.
          const marker = call.closest('sup') || call
          marker.parentNode.replaceChild(span, marker)
          moved++
        })

        if (moved > 0) {
          // Remove the now-redundant end-of-document footnotes section(s).
          content
            .querySelectorAll('.footnotes, .pdf-footnotes-block')
            .forEach((sec) => sec.remove())
        }
      } catch (e) {
        // On any error, leave the end-of-document fallback in place.
        console.warn(
          '[pagedHandlers] Footnote handler skipped, keeping end section:',
          e && e.message
        )
      }
    }
  }

  /* ----------------------------------------------------------------------- *
   * 3. Long URL wrapping
   * ----------------------------------------------------------------------- */
  class LinkHandler extends Paged.Handler {
    beforeParsed(content) {
      try {
        const body = content.querySelector('.article-body')
        if (!body) return
        const links = body.querySelectorAll('a[href^="http"], a[href^="www"]')
        links.forEach((link) => {
          // Only rewrite links whose text is itself a bare URL; leave labelled
          // links ("see here") alone.
          const txt = link.textContent || ''
          if (!/^(https?:\/\/|www\.)/.test(txt.trim())) return
          link.innerHTML = txt
            .replace(/\/\//g, '//​')
            .replace(/([/.?=&_-])/g, '$1​')
        })
      } catch (e) {
        console.warn('[pagedHandlers] Link handler skipped:', e && e.message)
      }
    }
  }

  /* ----------------------------------------------------------------------- *
   * 4. Cover fit — shrink the abstract so the cover stays one page
   *
   * We deliberately do NOT measure rendered height: in beforeParsed the only
   * laid-out DOM is the screen-media original, whose geometry doesn't match
   * paged.js's print pagination (measuring it was wrong in both directions).
   * Instead we use a deterministic, context-independent model: estimate how
   * much vertical space the fixed front matter (logo, title, authors,
   * affiliations, DOI, cite, date, tags, labels) consumes, then pick the
   * largest abstract font size whose text is expected to fit the remaining
   * space. Calibrated against measured A4 covers:
   *   • content box ≈ 261mm tall; abstract column ≈ 166mm wide
   *   • at 10pt/1.5 a line holds ≈ 14 words and is ≈ 5.3mm tall
   *   • a single-author cover fits ≈ 370 abstract words at 10pt; a 460-word
   *     abstract needs ≈ 9pt — this model reproduces both.
   * Font floor is 7pt: the rare 400+ word abstract atop heavy front matter may
   * still spill to page 2 (legibility chosen over a hard one-page rule).
   * ----------------------------------------------------------------------- */
  class CoverFitHandler extends Paged.Handler {
    beforeParsed(content) {
      try {
        const cover = content.querySelector('.pdf-cover')
        const abstract = content.querySelector('.pdf-abstract')
        if (!cover || !abstract) return

        const words = abstract.textContent
          .trim()
          .split(/\s+/)
          .filter(Boolean).length
        if (!words) return

        // Each extra row of authors/affiliations or tag group eats into the
        // abstract's budget, so spend part of the word allowance on them.
        // (Author/affiliation block longer than ~3 lines, and each tag group,
        // shift every threshold down.)
        const authorsEl = cover.querySelector('.pdf-cover-authors')
        const authorChars = authorsEl ? authorsEl.textContent.trim().length : 0
        const extraAuthorLines = Math.max(0, Math.ceil(authorChars / 90) - 3)
        const tagGroups = cover.querySelectorAll('.pdf-tags').length
        // ~9 abstract words of vertical space per extra front-matter line.
        const penalty = (extraAuthorLines + tagGroups * 2) * 9
        const effWords = words + penalty

        // Word-count → font-size, calibrated from measured A4 covers:
        //   ≤360 words fit at 10pt; ~460 words need 9pt. Each ~0.5pt step down
        //   buys roughly another ~55 words. 7pt is the readability floor; an
        //   abstract longer than the 7pt budget simply flows onto page 2.
        const STEPS = [
          [360, 10],
          [415, 9.5],
          [470, 9],
          [530, 8.5],
          [595, 8],
          [665, 7.5],
          [99999, 7],
        ]
        let size = 10
        for (const [limit, pt] of STEPS) {
          if (effWords <= limit) {
            size = pt
            break
          }
        }

        if (size < 10) {
          abstract.style.fontSize = size + 'pt'
          // Tighten leading slightly as we shrink, like real typesetting.
          abstract.style.lineHeight = (1.5 - (10 - size) * 0.03).toFixed(3)
        }
      } catch (e) {
        // Non-fatal: fall back to the CSS default abstract size (it just flows).
        console.warn(
          '[pagedHandlers] Cover-fit handler skipped:',
          e && e.message
        )
      }
    }
  }

  /* ----------------------------------------------------------------------- *
   * 5. Footer width — scale the @bottom-left citation box to its text length
   *
   * paged.js lays the bottom margin as a 3-column grid and sizes the left box
   * to its content; a `width`/`max-width` set via an @page rule injected from
   * the Nuxt <head> is NOT picked up (paged.js reads @page rules only from the
   * stylesheets it is given, before our injected one exists). The reliable hook
   * is here: after each page is laid out we measure the citation length from the
   * surviving source span and set the box width directly on the generated DOM,
   * so a short citation gets a narrow box (wrapping sooner) and a long one widens
   * toward the page edge.
   * ----------------------------------------------------------------------- */
  class FooterWidthHandler extends Paged.Handler {
    constructor(...args) {
      super(...args)
      this.widthPct = null
    }

    // Read the citation once from the source span (textContent already has real
    // non-breaking spaces, so each counts as one char — &nbsp; doesn't inflate).
    beforeParsed(content) {
      try {
        const src = content.querySelector('.pdf-footer-citation')
        const len = src ? src.textContent.trim().length : 0
        if (!len) return
        // Width the box so the citation lands on ~2 lines: less text → narrower
        // box, more text → wider, capped at full width (after which it grows in
        // height). At ~7pt the full-width (100%) box fits ≈95 chars per line, so
        // two lines need a width that holds len/2 chars. Segments are glued with
        // &nbsp; and split only at "·". A full-width 7pt line fits ≈120 chars;
        // we target a slightly lower 105 so short citations get a touch more
        // width (fewer lines) while still scaling visibly by length.
        const CHARS_PER_FULL_LINE = 105
        const TARGET_LINES = 2
        const MIN_W = 45 // never thinner than this (shortest citations)
        const MAX_W = 86 // page-number slot lives to the right of this
        const needed = (len / TARGET_LINES / CHARS_PER_FULL_LINE) * 100
        this.widthPct = Math.round(Math.min(MAX_W, Math.max(MIN_W, needed)))
      } catch (e) {
        this.widthPct = null
      }
    }

    // Each laid-out page gets its own margin boxes; size the left one. The box
    // is a flex item sized to content by default, so pin width + flex-basis and
    // let the content fill it, forcing the citation to wrap at the target width.
    afterPageLayout(pageFragment) {
      try {
        if (!this.widthPct) return
        const box = pageFragment.querySelector('.pagedjs_margin-bottom-left')
        if (!box) return
        const w = this.widthPct + '%'
        box.style.width = w
        box.style.maxWidth = w
        box.style.flex = '0 0 ' + w
        const content = box.querySelector('.pagedjs_margin-content')
        if (content) content.style.width = '100%'
      } catch (e) {
        console.warn(
          '[pagedHandlers] Footer-width handler skipped:',
          e && e.message
        )
      }
    }
  }

  Paged.registerHandlers(
    TocHandler,
    FootnoteHandler,
    LinkHandler,
    CoverFitHandler,
    FooterWidthHandler
  )
})()
