import classicReferenceRegex from '../../../utils/classicReferenceRegex'
import { recordMissingReference } from '../../../utils/contentUtilities'

// Body transformer that rewrites *textual* in-text references — `(Author, YYYY)`,
// `(Author & Other, YYYY)`, `(Author et al., YYYY; Other, YYYY)` — into citation-key
// tokens `(@bibtexkey)`. Those `@key` tokens are resolved into linked references later
// by insertBibliographicalReferences.js (which matches referenceRegex = `@key` and looks
// the key up in the parsed bibliography). This pass must therefore run BEFORE
// insertBodyStructureIndex (which triggers that resolution) in the transformer chain.
//
// `biblio` is the array produced by insertBibliography.js: CSL-JSON records spread over
// formatting helpers. The fields we match on are:
//   - item.id                      → the bibtex citation key, e.g. "cappelen2017a"
//   - item.author[].family         → author surnames
//   - item.issued['date-parts']    → [[year, ...]]
// Matching on the structured CSL data (not on substrings of item.id) is what lets us
// resolve multi-author keys whose key only encodes the first author.

// Extract the publication year (as a string) from a CSL record.
const bibYear = (item) => {
  const parts = item?.issued?.['date-parts']?.[0]
  return parts?.[0] != null ? String(parts[0]) : null
}

// Normalise a name fragment for comparison: lower-case, strip accents, drop anything
// that isn't a letter. This makes "Müller" match "muller" and "O'Neill" match "oneill".
const normalize = (str) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')

// Leading "filler" words/phrases that precede the real author in a parenthetical and
// must be stripped before we look at the surname, e.g. "(cf. Klein, 2008)",
// "(see e.g., Verschure, 2016)", "(cited in James, 2002)", "(extract from Muntanyola
// Saura, 2016)". The list is matched at the START of the author segment, optionally
// repeated (e.g. "see e.g.,"), each token followed by optional punctuation/space.
const LEADING_STOPWORDS = [
  'see also',
  'see e.g.',
  'see eg',
  'see for example',
  'see for reference',
  'for example',
  'for an overview see',
  'for early evidence see',
  'for a critical discussion of these developments see',
  'cf. also',
  'cf. bibliographie de',
  'cited in',
  'based on',
  'extract from',
  'but see',
  'interview to',
  'cf',
  'see',
  'e.g.',
  'eg',
  'i.e.',
  'ie',
  'also',
  'viz',
]

// Build a regex that eats one-or-more leading stopwords (longest first so "see also"
// wins over "see"), each optionally followed by a comma/colon/period and whitespace.
const STOPWORD_RE = new RegExp(
  '^(?:(?:' +
    LEADING_STOPWORDS.slice()
      .sort((a, b) => b.length - a.length)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') +
    ')[\\s.,:;"]*)+',
  'i'
)

// Strip leading filler words from an author segment, returning the bare author part.
// "see e.g., Verschure" → "Verschure", "cited in James" → "James".
const stripStopwords = (authorSegment) =>
  (authorSegment || '').replace(STOPWORD_RE, '').trim()

// Particle words that may or may not be stored as part of a CSL `family` field, so we
// must be tolerant of their presence on either side ("van den Berg" vs "Berg",
// "de Vignemont" vs "Vignemont", "O'Reilly" vs "oreilly").
const NAME_PARTICLES = new Set([
  'van',
  'von',
  'der',
  'den',
  'de',
  'di',
  'da',
  'del',
  'della',
  'la',
  'le',
  'du',
  'dos',
  'das',
  'el',
  'al',
  'st',
])

// Given a single author fragment (one person, already separator-split), produce the set
// of normalized candidate surname forms to test against a bib entry's family names.
// We can't know how the bibliography stored a multi-word name, so we offer several:
//   - the whole fragment joined           ("vandenberg", "oreillyiii")
//   - the whole fragment minus particles  ("berg")
//   - the last significant (non-particle, non-initial) word ("berg", "cicourel")
//   - the joined non-particle tail        (covers "muntanyola saura" → "muntanyolasaura")
// Initials ("A.", "V.", "J. B.") and trailing suffixes ("III", "Jr") are dropped.
const surnameCandidates = (fragment) => {
  const words = fragment
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
  // Words that are just initials (single letter, optionally dotted) carry no surname.
  const isInitial = (w) => /^[a-z]\.?$/i.test(w)
  const isSuffix = (w) => /^(?:iii|ii|iv|jr|sr)\.?$/i.test(w)
  const significant = words.filter((w) => !isInitial(w) && !isSuffix(w))
  const candidates = new Set()
  // Whole fragment, including particles, normalized.
  candidates.add(normalize(fragment))
  // Each individual significant word (so "A. V. Cicourel" matches "cicourel").
  significant.forEach((w) => candidates.add(normalize(w)))
  // Joined significant words, with and without leading particles, so two-word surnames
  // like "Muntanyola Saura" and particled names like "van den Berg" both resolve.
  const joined = (arr) => normalize(arr.join(''))
  candidates.add(joined(significant))
  candidates.add(
    joined(significant.filter((w) => !NAME_PARTICLES.has(w.toLowerCase())))
  )
  // The last significant word alone (the most common "family" form).
  if (significant.length) {
    candidates.add(normalize(significant[significant.length - 1]))
  }
  candidates.delete('')
  return [...candidates]
}

// Pull the candidate author surname(s) out of the textual reference's author segment.
// Returns an array (one entry per cited person) of candidate-form arrays, e.g.
// "A. V. Cicourel & Lahlou" → [["avcicourel","cicourel"], ["lahlou"]]. We only need the
// surnames to disambiguate against the year; given names never appear in this style.
const extractAuthorTokens = (authorSegment) =>
  stripStopwords(authorSegment)
    // split on the usual multi-author separators
    .split(/\s*(?:&|;|,|\band\b|\bet\b\s*\bal\.?)\s*/i)
    .map((fragment) => fragment.trim())
    .filter(Boolean)
    .map(surnameCandidates)
    .filter((cands) => cands.length)

// Locator/caption words that precede a number inside parentheses and would otherwise
// look like a "(word number, year)" citation, e.g. "(see Table 2, 2020)".
const NON_AUTHOR_LOCATORS =
  /\b(?:table|figure|fig|chapter|chap|section|sec|page|pp?|vol|volume|no|eq|equation)\b/i

// Is the comma's left-hand segment plausibly an author name (so an unresolved match is
// worth warning about), rather than a caption/locator like "Table 2" or "p. 14"? Used
// ONLY to gate the "not found" log — the matching itself is unaffected, since such
// segments never appear as an author in the bibliography and so never resolve anyway.
const looksLikeCitation = (authorSegment) => {
  if (!authorSegment) return false
  if (/\d/.test(authorSegment)) return false // names don't contain digits
  if (NON_AUTHOR_LOCATORS.test(authorSegment)) return false
  // Must contain at least one real (letter-led) word once accents are stripped.
  return extractAuthorTokens(authorSegment).length > 0
}

// Expand a single bib `family` into the set of normalized forms it could be cited as.
// A CSL family like "van den Berg" might be written "(van den Berg, …)" (full),
// "(Berg, …)" (bare surname), or stored particle-first. We emit the whole join, the
// particle-stripped join, and the last word so cited candidates can match on equality
// (no loose substring matching, which mis-linked "Hofmann" → "Mann").
const familyForms = (family) => {
  const words = (family || '').split(/\s+/).filter(Boolean)
  const forms = new Set([normalize(family)])
  if (words.length) forms.add(normalize(words[words.length - 1]))
  forms.add(
    normalize(
      words.filter((w) => !NAME_PARTICLES.has(w.toLowerCase())).join('')
    )
  )
  forms.delete('')
  return forms
}

// Does a cited author (its candidate surname forms) match one of the entry's authors
// (each expanded to its own form set)? Pure set membership — exact, no substring fuzz.
const authorMatchesFamily = (candidates, familyFormSets) =>
  candidates.some((cand) => familyFormSets.some((forms) => forms.has(cand)))

// Does this bibliography entry match the textual reference (author surname(s) + year)?
// We require the year to match exactly and at least the first cited surname to be one of
// the entry's author families (a textual "(Smith et al., 2020)" only spells out Smith,
// while the entry lists every author). `citedAuthors` is the array-of-candidate-arrays
// produced by extractAuthorTokens.
const matchesReference = (item, citedAuthors, year) => {
  if (bibYear(item) !== year) return false
  if (!citedAuthors.length) return false
  const familyFormSets = (item.author || [])
    .map((a) => familyForms(a.family))
    .filter((forms) => forms.size)
  if (!familyFormSets.length) return false
  // The first cited surname must appear among the entry's authors…
  if (!authorMatchesFamily(citedAuthors[0], familyFormSets)) return false
  // …and every additional spelled-out surname must too (guards against collisions
  // between two same-year, same-first-author works).
  return citedAuthors.every((cands) =>
    authorMatchesFamily(cands, familyFormSets)
  )
}

// Recursively walk a content node, converting every textual reference it (or its
// descendants) contains into a citation key. `slug` is the article slug, forwarded so
// unresolved references can be attributed to their source article in the report.
const insertCitationKeysInNode = (node, biblio, slug) => {
  try {
    // Rewrite a single textual reference (e.g. "(Cappelen, 2017)" or, inside a grouped
    // citation, "Cappelen, 2017") into "@cappelen2017a", preserving any surrounding
    // parenthesis/semicolon punctuation it carried.
    // Tracks unresolved references already logged for this node, keyed by author+year,
    // so the primary "(Author, 2008)" and its supplementary "(Author, 2008" prefix don't
    // each emit a separate "not found" line.
    const warned = new Set()

    const replaceRegularReference = (node, match) => {
      let isOpening = false
      let isClosing = false
      // Preserve any whitespace around the reference (grouped citations are split on
      // ';' and keep their leading space, e.g. " Other, YYYY") so it survives the swap.
      const leadingWs = match.match(/^\s*/)[0]
      const trailingWs = match.match(/\s*$/)[0]
      let core = match.trim()
      if (core.startsWith('(')) {
        core = core.slice(1)
        isOpening = true
      }
      if (core.endsWith(')')) {
        core = core.slice(0, -1)
        isClosing = true
      }
      core = core.trim()

      // Already a citation key (e.g. "(@cappelen2017a)") — nothing to convert.
      if (core.startsWith('@')) return node

      // Drop leading filler ("cf.", "see e.g.,", "cited in", …) up front so it can't be
      // mistaken for the author segment — important when the filler itself ends in a
      // comma ("e.g., King" would otherwise split to author "e.g.").
      const stripped = stripStopwords(core)
      const authorSegment = stripped.split(',')[0]?.trim()
      // The year is the first 4-digit run after the comma (handles "2017", "2017a",
      // "2017, p. 12" etc.).
      const year = stripped.split(',').slice(1).join(',').match(/\d{4}/)?.[0]
      if (!authorSegment || !year) return node

      const authorTokens = extractAuthorTokens(authorSegment)
      const bibMatch = biblio.find((item) =>
        matchesReference(item, authorTokens, year)
      )

      if (bibMatch) {
        node.value = node.value.replace(
          match,
          leadingWs +
            (isOpening ? '(' : '') +
            '@' +
            bibMatch.id +
            (isClosing ? ')' : '') +
            trailingWs
        )
      } else if (looksLikeCitation(authorSegment)) {
        // Only warn when the author segment is name-shaped. Parentheticals like
        // "(see Table 2, 2020)" or "(p. 14, 2020)" never resolve anyway (no bib entry
        // has such an author), so logging them would just be noise that buries the
        // genuinely-missing references. De-duplicate by author+year so the closed and
        // unclosed captures of the same reference only warn once.
        // TODO surface unresolved references in the CMS (see insertBibliographicalReferences)
        const key = normalize(authorSegment) + '|' + year
        if (!warned.has(key)) {
          warned.add(key)
          console.log('REFERENCE NOT FOUND IN BIB FILE: ', match.trim())
          // Collect it (with its article slug) for the generated report / CMS.
          recordMissingReference(slug, match)
        }
      }
      return node
    }

    const replaceReference = (node) => {
      // Match every textual reference in this text node. classicReferenceRegex matches
      // the whole "(Author, YYYY)" / "(Author, YYYY; Other, YYYY)" construct.
      const primary =
        node.value.match(new RegExp(classicReferenceRegex, 'gi')) || []

      // Supplementary pass for references the primary regex misses because they are not
      // cleanly closed by ")" right after the year:
      //   - unclosed groups split across lines/nodes:  "(Rochet & Tirole, 2006"
      //   - a trailing locator before the close:        "(e.g., King, 2010, p. 294"
      //   - a continuation fragment opening a node:     " Rysman, 2009)"
      // We capture from an opening "(" (or start-of-node) through the first 4-digit year,
      // then let replaceRegularReference parse out author+year as usual. Anything already
      // caught verbatim by the primary pass is de-duplicated away below.
      const supplementary =
        node.value.match(/\([^()]*?,\s*\d{4}|^[^()]*?,\s*\d{4}\)?/g) || []

      const matches = [...primary, ...supplementary]
      if (!matches.length) return node

      Array.from(new Set(matches))
        .filter((match) => match?.length && !match.includes('@'))
        // Process longer matches first so a fully-formed "(Author, 2006)" is converted
        // before its bare "(Author, 2006" supplementary prefix is tried on the result.
        .sort((a, b) => b.length - a.length)
        .forEach((match) => {
          // A supplementary prefix whose text was already rewritten by a longer match
          // (now containing "@") no longer exists in node.value — skip it.
          if (!node.value.includes(match)) return
          // Grouped citations — "(Author, YYYY; Other, ZZZZ)" — are converted one
          // citation at a time so each resolves to its own key.
          if (match.includes(';')) {
            // Strip the outer parens once, split on ';', then re-add them only to the
            // first/last fragment so the group stays "(@a; @b; @c)".
            const inner = match.replace(/^\(/, '').replace(/\)$/, '')
            const fragments = inner.split(';')
            fragments.forEach((fragment, i) => {
              const decorated =
                (i === 0 ? '(' : '') +
                fragment +
                (i === fragments.length - 1 ? ')' : '')
              node = replaceRegularReference(node, decorated)
            })
          } else {
            node = replaceRegularReference(node, match)
          }
        })

      return node
    }

    if (node.type === 'text') {
      node = replaceReference(node)
    } else if (node?.children?.length > 0) {
      node.children = node.children.map((child) =>
        insertCitationKeysInNode(child, biblio, slug)
      )
    }
    return node
  } catch (error) {
    console.log('error: ', error)
    return node
  }
}

// Body-transformer entry point, matching the (node, article, media, authors, issues,
// options) signature used by processArticle. Returns the same tuple with the node's
// textual references converted to `@key` tokens; a no-op when the article has no
// bibliography.
const insertCitationKeys = (node, article, media, authors, issues, options) => {
  if (article?.bibliography?.length) {
    node = insertCitationKeysInNode(node, article.bibliography, article?.slug)
  }
  return [node, article, media, authors, issues, options]
}

export default insertCitationKeys
