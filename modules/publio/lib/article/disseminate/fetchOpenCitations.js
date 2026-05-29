import isOffline from '../../../utils/isOffline'
const chalk = require('chalk')

// OpenCitations Index REST API v2 (https://opencitations.net/index/api/v2).
// `citations/doi:<DOI>`  → works that CITE this article ("cited by")
// `references/doi:<DOI>` → works this article CITES ("references")
const OC_BASE = 'https://opencitations.net/index/api/v2'

// Canonicalise a DOI to its bare form (strip any doi.org prefix + whitespace),
// matching what buildExportMeta does for the export formats.
const bareDoi = (value = '') =>
  String(value)
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')

// A row from /citations is { oci, citing, cited, ... } where `citing` is the
// DOI of the work pointing at us; a row from /references is the mirror, where
// `cited` is the DOI of the work we point at. Normalise both into
// { oci, doi } pointing at the OTHER work.
const normaliseRows = (rows, otherKey) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      oci: row.oci || '',
      // OpenCitations returns the id prefixed (e.g. "doi:10.…  coci => …");
      // take the first doi: token if several id schemes are listed.
      doi: bareDoi(
        (row[otherKey] || '')
          .split(/\s+/)
          .find((tok) => /^(doi:)?10\./i.test(tok))
          ?.replace(/^doi:/i, '') || ''
      ),
    }))
    .filter((entry) => entry.doi)

const fetchJson = async (url, token) => {
  const res = await fetch(url, {
    headers: {
      accept: 'application/json',
      ...(token ? { authorization: token } : {}),
    },
  })
  if (!res.ok) {
    throw new Error(`OpenCitations ${res.status} for ${url}`)
  }
  return res.json()
}

// Attaches `article.citedBy = { citing: [{oci, doi}], cited: [{oci, doi}] }`
// to every article that has a valid DOI. Runs at build time only — the
// OPENCITATIONS_TOKEN lives in CI as an org secret, so dev/offline builds skip
// the network entirely and simply leave `citedBy` unset (the panel then hides
// itself client-side).
export default async (articles, options) => {
  if (isOffline()) {
    console.log('OFFLINE mode: skipping fetchOpenCitations')
    return articles
  }

  const token = process.env.OPENCITATIONS_TOKEN
  if (!token) {
    // Anonymous access works but is heavily rate-limited; warn once so a
    // missing secret is visible in CI logs without failing the build.
    console.warn(
      chalk.yellow(
        '⚠ OPENCITATIONS_TOKEN not set — querying OpenCitations anonymously (rate-limited)'
      )
    )
  }

  for (const article of articles) {
    const doi = bareDoi(article.DOI || article.doi || '')
    if (!doi) continue

    try {
      const [citations, references] = await Promise.all([
        fetchJson(`${OC_BASE}/citations/doi:${doi}`, token),
        fetchJson(`${OC_BASE}/references/doi:${doi}`, token),
      ])

      const citing = normaliseRows(citations, 'citing')
      const cited = normaliseRows(references, 'cited')

      if (citing.length || cited.length) {
        article.citedBy = { citing, cited }
        console.log(
          chalk.green(
            `OpenCitations: "${article.slug}" — ${citing.length} citing, ${cited.length} references`
          )
        )
      }
    } catch (error) {
      // A throttled or failing request must never break the build.
      console.warn(
        chalk.yellow(
          `⚠ OpenCitations lookup failed for "${article.slug}" (${doi}): ${error.message}`
        )
      )
    }
  }

  return articles
}
