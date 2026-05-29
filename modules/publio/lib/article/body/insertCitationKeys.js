import classicReferenceRegex from '../../../utils/classicReferenceRegex'

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

// Pull the candidate author surname(s) out of the textual reference's author segment,
// e.g. "Cappelen & Dever" → ["cappelen", "dever"], "Smith et al." → ["smith"],
// "von Wright" → ["vonwright"]. We only need the surnames to disambiguate against the
// year; given names never appear in this citation style.
const extractAuthorTokens = (authorSegment) =>
  authorSegment
    // split on the usual multi-author separators
    .split(/\s*(?:&|;|,|\band\b|\bet\b\s*\bal\.?)\s*/i)
    .map(normalize)
    .filter(Boolean)

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

// Does this bibliography entry match the textual reference (author surname(s) + year)?
// We require the year to match exactly and at least the first cited surname to be one of
// the entry's author families (a textual "(Smith et al., 2020)" only spells out Smith,
// while the entry lists every author).
const matchesReference = (item, authorTokens, year) => {
  if (bibYear(item) !== year) return false
  if (!authorTokens.length) return false
  const families = (item.author || []).map((a) => normalize(a.family))
  // The first cited surname must appear among the entry's authors…
  if (!families.includes(authorTokens[0])) return false
  // …and every additional spelled-out surname must too (guards against collisions
  // between two same-year, same-first-author works).
  return authorTokens.every((token) => families.includes(token))
}

// Recursively walk a content node, converting every textual reference it (or its
// descendants) contains into a citation key.
const insertCitationKeysInNode = (node, biblio) => {
  try {
    // Rewrite a single textual reference (e.g. "(Cappelen, 2017)" or, inside a grouped
    // citation, "Cappelen, 2017") into "@cappelen2017a", preserving any surrounding
    // parenthesis/semicolon punctuation it carried.
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

      const authorSegment = core.split(',')[0]?.trim()
      // The year is the first 4-digit run after the comma (handles "2017", "2017a",
      // "2017, p. 12" etc.).
      const year = core.split(',').slice(1).join(',').match(/\d{4}/)?.[0]
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
        // genuinely-missing references.
        // TODO surface unresolved references in the CMS (see insertBibliographicalReferences)
        console.log('REFERENCE NOT FOUND IN BIB FILE: ', match)
      }
      return node
    }

    const replaceReference = (node) => {
      // Match every textual reference in this text node. classicReferenceRegex matches
      // the whole "(Author, YYYY)" / "(Author, YYYY; Other, YYYY)" construct.
      const matches = node.value.match(new RegExp(classicReferenceRegex, 'gi'))
      if (!matches?.length) return node

      Array.from(new Set(matches))
        .filter((match) => match?.length && !match.includes('@'))
        .forEach((match) => {
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
        insertCitationKeysInNode(child, biblio)
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
    node = insertCitationKeysInNode(node, article.bibliography)
  }
  return [node, article, media, authors, issues, options]
}

export default insertCitationKeys
