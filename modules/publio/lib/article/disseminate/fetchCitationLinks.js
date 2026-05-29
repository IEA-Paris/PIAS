import isOffline from '../../../utils/isOffline'
const chalk = require('chalk')

// Resolves the citation graph around each article (works that cite it, and
// works it references) from the open citation indexes, attaching
//   article.citedBy = { citing: [{doi, title, year}], cited: [{doi, title, year}] }
//
// Two sources are merged, in order of coverage for THIS journal:
//
//   1. OpenAIRE ScholExplorer (https://api.scholexplorer.openaire.eu) — the
//      primary source. PIAS mints Zenodo (DataCite) DOIs, which OpenCitations
//      does NOT index (its COCI graph is Crossref-only). ScholExplorer covers
//      DataCite/Zenodo and returns rich link metadata (title, authors, date).
//
//   2. OpenCitations Index v2 (https://api.opencitations.net) — a supplement
//      that catches any Crossref-indexed citations ScholExplorer misses. Bare
//      DOIs only (no titles). Uses OPENCITATIONS_TOKEN when available.
//
// NOTE: neither open index matches Google Scholar's proprietary, full-text
// citation graph, so some Scholar-visible citations of Zenodo DOIs will not
// appear here. The panel hides itself when no links are found.
//
// Runs at build time only; offline/dev builds skip the network entirely and
// leave `citedBy` unset.

const SCHOLEXPLORER_BASE = 'https://api.scholexplorer.openaire.eu/v3/Links'
const OPENCITATIONS_BASE = 'https://api.opencitations.net/index/v2'

// Canonicalise a DOI to its bare lowercase form (strip any doi.org prefix +
// surrounding whitespace), matching what buildExportMeta does for exports.
const bareDoi = (value = '') =>
  String(value)
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .toLowerCase()

const fetchJson = async (url, headers = {}) => {
  const res = await fetch(url, {
    headers: { accept: 'application/json', ...headers },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

// ── OpenAIRE ScholExplorer ────────────────────────────────────────────────
// A link row carries { RelationshipType, source, target }. We always want the
// OTHER end of the relationship: for "works citing us" (targetPid=DOI) that's
// `source`; for "works we reference" (sourcePid=DOI) that's `target`.
// Each end exposes Identifier[] with possibly several schemes/duplicates plus
// OpenAIRE-internal ids — keep the first real DOI that isn't our own.
const scholexEntry = (end, selfDoi) => {
  const dois = (end?.Identifier || [])
    .filter((id) => id.IDScheme === 'doi')
    .map((id) => bareDoi(id.ID))
    .filter((d) => d && d !== selfDoi)
  if (!dois.length) return null
  const date = end.PublicationDate || ''
  return {
    doi: dois[0],
    title: end.Title || '',
    year: date ? String(date).slice(0, 4) : '',
  }
}

const fetchScholExplorer = async (doi) => {
  // `relation=Cites` on targetPid → only inbound citations; sourcePid → the
  // article's own reference list (relation direction is implicit).
  const [incoming, outgoing] = await Promise.all([
    fetchJson(
      `${SCHOLEXPLORER_BASE}?targetPid=${encodeURIComponent(
        doi
      )}&relation=Cites`
    ),
    fetchJson(`${SCHOLEXPLORER_BASE}?sourcePid=${encodeURIComponent(doi)}`),
  ])
  const citing = (incoming.result || [])
    .map((r) => scholexEntry(r.source, doi))
    .filter(Boolean)
  const cited = (outgoing.result || [])
    .map((r) => scholexEntry(r.target, doi))
    .filter(Boolean)
  return { citing, cited }
}

// ── OpenCitations Index v2 ──────────────────────────────────────────────────
// A row is { oci, citing, cited, ... } where each id field is a space-joined
// list of schemes ("omid:br/… doi:10.… openalex:… pmid:…"). Pull the doi token
// of the OTHER work. No titles available.
const openCitationsRows = (rows, otherKey, selfDoi) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const token = (row[otherKey] || '')
        .split(/\s+/)
        .find((t) => /^doi:10\./i.test(t))
      const doi = token ? bareDoi(token.replace(/^doi:/i, '')) : ''
      return doi && doi !== selfDoi ? { doi, title: '', year: '' } : null
    })
    .filter(Boolean)

const fetchOpenCitations = async (doi, token) => {
  const headers = token ? { authorization: token } : {}
  const [citations, references] = await Promise.all([
    fetchJson(`${OPENCITATIONS_BASE}/citations/doi:${doi}`, headers),
    fetchJson(`${OPENCITATIONS_BASE}/references/doi:${doi}`, headers),
  ])
  return {
    citing: openCitationsRows(citations, 'citing', doi),
    cited: openCitationsRows(references, 'cited', doi),
  }
}

// Merge entries from multiple sources, deduping by DOI and preferring the
// richer record (one that carries a title) when the same DOI appears twice.
const mergeByDoi = (...lists) => {
  const byDoi = new Map()
  for (const entry of lists.flat()) {
    const existing = byDoi.get(entry.doi)
    if (!existing || (!existing.title && entry.title)) {
      byDoi.set(entry.doi, entry)
    }
  }
  return [...byDoi.values()]
}

export default async (articles, options) => {
  if (isOffline()) {
    console.log('OFFLINE mode: skipping fetchCitationLinks')
    return articles
  }

  const ocToken = process.env.OPENCITATIONS_TOKEN
  if (!ocToken) {
    console.warn(
      chalk.yellow(
        '⚠ OPENCITATIONS_TOKEN not set — querying OpenCitations anonymously (rate-limited)'
      )
    )
  }

  for (const article of articles) {
    const doi = bareDoi(article.DOI || article.doi || '')
    if (!doi) continue

    // Query both sources independently so one failing/throttling never blocks
    // the other, and a build is never broken by a network error.
    const [scholex, opencit] = await Promise.all([
      fetchScholExplorer(doi).catch((error) => {
        console.warn(
          chalk.yellow(
            `⚠ ScholExplorer lookup failed for "${article.slug}" (${doi}): ${error.message}`
          )
        )
        return { citing: [], cited: [] }
      }),
      fetchOpenCitations(doi, ocToken).catch((error) => {
        console.warn(
          chalk.yellow(
            `⚠ OpenCitations lookup failed for "${article.slug}" (${doi}): ${error.message}`
          )
        )
        return { citing: [], cited: [] }
      }),
    ])

    const citing = mergeByDoi(scholex.citing, opencit.citing)
    const cited = mergeByDoi(scholex.cited, opencit.cited)

    if (citing.length || cited.length) {
      article.citedBy = { citing, cited }
      console.log(
        chalk.green(
          `citation links: "${article.slug}" — ${citing.length} citing, ${cited.length} references`
        )
      )
    }
  }

  return articles
}
