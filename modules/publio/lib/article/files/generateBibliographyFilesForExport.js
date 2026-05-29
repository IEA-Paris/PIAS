import Citation from 'citation-js'
import {
  buildExportMeta,
  toTEI,
  toDublinCore,
  toDCTerms,
  toDataCite,
  toCOinS,
} from './exportFormats'
const chalk = require('chalk')

// citation-js's BibTeX formatter (this version) drops the DOI even when it is
// present in the CSL record — RIS keeps it, BibTeX does not. Inject a
// `doi = {…}` field after the entry's opening line so the .bib export is
// complete. Idempotent: skips if the entry already carries a doi field.
const injectBibtexDoi = (bibtex, doi) => {
  if (!bibtex || !doi) return bibtex
  if (/^\s*doi\s*=/im.test(bibtex)) return bibtex
  // Insert right after the first "@type{citekey,\n" line.
  return bibtex.replace(/(@\w+\{[^,]*,\n)/, `$1  doi = {${doi}},\n`)
}

// Builds every downloadable bibliographic export payload for an article and
// attaches them to `article.exports`. The client (CiteModal.vue) reads this
// map directly — so citation-js stays out of the client bundle and static
// export works offline.
//
// citation-js covers BibTeX, RIS (the EndNote/Zotero/Mendeley interchange
// format) and CSL-JSON; the XML metadata standards (TEI, Dublin Core, DC
// Terms, DataCite) are built from the same normalised metadata in
// ./exportFormats.js.
//
// Runs AFTER insertCitationElements, which attaches `article.docData`.
export default (article, media, authors, issues, options) => {
  try {
    const docData = article.docData
    if (!docData) {
      // No metadata to work from (e.g. citation generation failed upstream).
      return [article, media, authors, issues, options]
    }

    const meta = buildExportMeta(docData, article, options)

    // citation-js's RIS plugin runs the DOI through this exact regex and does
    // `.match(...)[0]` with no null-guard, so any value that isn't a
    // well-formed DOI (a bare Zenodo id, a placeholder, an empty string)
    // throws "Failed to convert DOI to DO" and aborts the whole export. We
    // pre-validate here and only hand citation-js a canonical DOI; otherwise
    // we omit it from the CSL (it still appears in the XML formats and the
    // modal's identifier rows via `meta.doi`).
    const DOI_REGEX = /10(?:\.[0-9]{4,})?\/[^\s]*[^\s.,]/
    const doiMatch = (meta.doi || '').match(DOI_REGEX)
    const validDoi = doiMatch ? doiMatch[0] : ''

    // Surface articles whose DOI is set but malformed, so the bad value can be
    // fixed in the frontmatter / Zenodo prereserve mapping. The DOI is dropped
    // from BibTeX/RIS/CSL for these (it would otherwise crash citation-js).
    if (meta.doi && !validDoi) {
      console.warn(
        chalk.yellow(
          `⚠ malformed DOI "${meta.doi}" on article "${
            article.article_title || article.slug
          }" — omitted from BibTeX/RIS/CSL exports`
        )
      )
    }

    // `docData` mixes CSL fields with Zenodo/OpenAIRE keys, which makes
    // citation-js mis-detect the entry as a @book and drop the DOI/date.
    // Build a clean CSL-JSON record from the normalised meta so BibTeX/RIS/
    // CSL come out as proper journal articles.
    const cslId = [meta.authors[0]?.family, meta.year]
      .filter(Boolean)
      .join('')
      .replace(/[^A-Za-z0-9]/g, '')
    const csl = {
      id: cslId || article.slug,
      type: 'article-journal',
      title: meta.title,
      'container-title': meta.journalName,
      author: meta.authors.map((a) => ({
        family: a.family,
        given: a.given,
      })),
      ...(meta.year && { issued: { 'date-parts': [[Number(meta.year)]] } }),
      ...(validDoi && { DOI: validDoi }),
      URL: meta.url,
      ...(meta.volume && { volume: String(meta.volume) }),
      ...(meta.issue && { issue: String(meta.issue) }),
      ...(meta.issn && { ISSN: meta.issn }),
      ...(meta.publisher && { publisher: meta.publisher }),
      ...(meta.abstract && { abstract: meta.abstract }),
      ...(meta.keywords.length && { keyword: meta.keywords.join(', ') }),
      language: meta.language,
    }
    const cite = new Citation(csl)

    // filename stem, e.g. "cordelois-2021-first-test-article"
    const stem = [meta.authors[0]?.family, meta.year, article.slug]
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')

    article.exports = {
      // key            label/format         payload                     extension / mime
      bibtex: {
        label: 'BibTeX',
        ext: 'bib',
        mime: 'application/x-bibtex',
        content: injectBibtexDoi(cite.format('bibtex'), validDoi),
      },
      ris: {
        label: 'EndNote',
        ext: 'ris',
        mime: 'application/x-research-info-systems',
        content: cite.format('ris'),
      },
      csl: {
        label: 'CSL-JSON',
        ext: 'json',
        mime: 'application/vnd.citationstyles.csl+json',
        content: JSON.stringify(cite.format('data'), null, 2),
      },
      tei: {
        label: 'XML-TEI',
        ext: 'xml',
        mime: 'application/tei+xml',
        content: toTEI(meta),
      },
      dublinCore: {
        label: 'Dublin Core',
        ext: 'xml',
        mime: 'application/xml',
        content: toDublinCore(meta),
      },
      dcTerms: {
        label: 'DC Terms',
        ext: 'xml',
        mime: 'application/xml',
        content: toDCTerms(meta),
      },
      datacite: {
        label: 'DataCite',
        ext: 'xml',
        mime: 'application/xml',
        content: toDataCite(meta),
      },
    }

    // Per-format download filename, e.g. exports.bibtex.filename
    Object.keys(article.exports).forEach((key) => {
      article.exports[key].filename = `${stem}.${article.exports[key].ext}`
    })

    // COinS / Z3988 OpenURL ContextObject — emitted as an invisible span on the
    // article page so reference-manager browser connectors can auto-detect it.
    article.coins = toCOinS(meta)

    return [article, media, authors, issues, options]
  } catch (error) {
    console.log(
      chalk.red(
        `error generating bibliography export files for article "${
          article?.article_title || article?.slug || 'unknown'
        }": `
      ),
      error
    )
    return [article, media, authors, issues, options]
  }
}
