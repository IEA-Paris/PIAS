// Builders for the bibliographic export formats that citation-js does not
// cover out of the box (XML-TEI, Dublin Core, DC Terms, DataCite). BibTeX,
// RIS/EndNote and CSL-JSON come straight from citation-js (see
// generateBibliographyFilesForExport.js).
//
// All builders take the same normalised `meta` object (see buildExportMeta)
// so the article-specific extraction logic lives in one place.

// Minimal XML escaper for text nodes & attribute values.
const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Normalise the citation-js `docData` object into a flat shape the XML/JSON
// builders below can consume without re-deriving anything.
export const buildExportMeta = (docData, article, options) => {
  const authors = (docData.author || []).map((a) => ({
    given: a.firstname || '',
    family: a.lastname || a.name || '',
    full: [a.firstname, a.lastname].filter(Boolean).join(' ') || a.name || '',
    affiliation: a.affiliation || '',
    orcid: a.orcid || '',
  }))

  const issuedDate = new Date(article.date)
  const year = isNaN(issuedDate) ? '' : issuedDate.getFullYear()
  const isoDate = isNaN(issuedDate) ? '' : issuedDate.toISOString().slice(0, 10)

  // Normalise the DOI to its canonical bare form (strip any doi.org prefix and
  // surrounding whitespace) so every export format emits the same value.
  const doi = String(article.DOI || article.doi || '')
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')

  return {
    title: docData.title || article.article_title || '',
    abstract: docData.abstract || article.abstract || '',
    authors,
    year,
    isoDate,
    language: docData.language || article.language || 'en',
    doi,
    url:
      (docData.link && docData.link[0] && docData.link[0].url) ||
      options.config.url + '/article/' + article.slug,
    keywords: docData.keywords || article.tags || [],
    journalName: docData.journal?.name || options.config.full_name || '',
    journalAcronym: docData.journal?.acronym || options.config.name || '',
    issn: options.config.identifier?.ISSN || '',
    publisher: options.config.publisher || options.config.full_name || '',
    volume: docData.journal?.volume || article.issueIndex || '',
    issue: docData.journal?.issue || '',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    licenseName: 'Creative Commons Attribution 4.0 International',
  }
}

// COinS — an OpenURL 1.0 ContextObject in KEV (key-encoded-value) format,
// destined for the `title` attribute of an invisible <span class="Z3988">.
// Zotero/Mendeley/EndNote browser connectors auto-detect this span and let the
// reader save the citation in one click, without opening the cite modal.
// Reference: http://ocoins.info/ — journal-article metadata format.
export const toCOinS = (m) => {
  // Each value is URL-encoded; spaces become "+" (KEV convention) rather than
  // the "%20" that encodeURIComponent emits.
  const enc = (value = '') =>
    encodeURIComponent(String(value)).replace(/%20/g, '+')

  const pairs = [
    ['ctx_ver', 'Z39.88-2004'],
    ['rft_val_fmt', 'info:ofi/fmt:kev:mtx:journal'],
    ['rft.genre', 'article'],
    ['rft.atitle', m.title],
    ['rft.jtitle', m.journalName],
    ['rft.date', m.isoDate || m.year],
    ['rft.volume', m.volume],
    ['rft.issue', m.issue],
    ['rft.issn', m.issn],
    ['rft.language', m.language],
    ['rft.pub', m.publisher],
  ]

  const kev = pairs
    // Drop empty values so the title attribute stays clean.
    .filter(
      ([, value]) => value !== '' && value !== undefined && value !== null
    )
    .map(([key, value]) => `${key}=${enc(value)}`)

  // One rft.au per author ("Family, Given" — the form connectors expect).
  m.authors.forEach((a) => {
    const name = a.full || [a.family, a.given].filter(Boolean).join(', ')
    if (name) kev.push(`rft.au=${enc(name)}`)
  })

  // Identifiers: DOI (when present) and the canonical article URL.
  if (m.doi) kev.push(`rft_id=${enc('info:doi/' + m.doi)}`)
  if (m.url) kev.push(`rft_id=${enc(m.url)}`)

  return kev.join('&')
}

// XML-TEI — a biblStruct fragment usable in a TEI <sourceDesc>/<listBibl>.
export const toTEI = (m) => {
  const authors = m.authors
    .map(
      (a) =>
        `        <author>\n` +
        `          <persName><forename>${esc(a.given)}</forename>` +
        `<surname>${esc(a.family)}</surname></persName>` +
        (a.affiliation
          ? `\n          <affiliation>${esc(a.affiliation)}</affiliation>`
          : '') +
        (a.orcid
          ? `\n          <idno type="ORCID">${esc(a.orcid)}</idno>`
          : '') +
        `\n        </author>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt><title>${esc(m.title)}</title></titleStmt>
      <sourceDesc>
        <biblStruct>
          <analytic>
            <title level="a" type="main">${esc(m.title)}</title>
${authors}
${
  m.doi ? `            <idno type="DOI">${esc(m.doi)}</idno>\n` : ''
}            <idno type="URL">${esc(m.url)}</idno>
          </analytic>
          <monogr>
            <title level="j">${esc(m.journalName)}</title>
${
  m.issn ? `            <idno type="ISSN">${esc(m.issn)}</idno>\n` : ''
}            <imprint>
              <publisher>${esc(m.publisher)}</publisher>
${
  m.volume
    ? `              <biblScope unit="volume">${esc(m.volume)}</biblScope>\n`
    : ''
}              <date when="${esc(m.isoDate)}">${esc(m.year)}</date>
            </imprint>
          </monogr>
        </biblStruct>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
</TEI>`
}

// Dublin Core (simple, the 15 elements) as an OAI-DC XML record.
export const toDublinCore = (m) => {
  const lines = []
  lines.push(`  <dc:title>${esc(m.title)}</dc:title>`)
  m.authors.forEach((a) =>
    lines.push(`  <dc:creator>${esc(a.full)}</dc:creator>`)
  )
  m.keywords.forEach((k) => lines.push(`  <dc:subject>${esc(k)}</dc:subject>`))
  if (m.abstract) {
    lines.push(`  <dc:description>${esc(m.abstract)}</dc:description>`)
  }
  if (m.publisher) {
    lines.push(`  <dc:publisher>${esc(m.publisher)}</dc:publisher>`)
  }
  if (m.isoDate) lines.push(`  <dc:date>${esc(m.isoDate)}</dc:date>`)
  lines.push(`  <dc:type>Text</dc:type>`)
  lines.push(`  <dc:format>text/html</dc:format>`)
  lines.push(
    `  <dc:identifier>${esc(
      m.doi ? 'https://doi.org/' + m.doi : m.url
    )}</dc:identifier>`
  )
  if (m.issn) {
    lines.push(`  <dc:source>ISSN: ${esc(m.issn)}</dc:source>`)
  }
  lines.push(`  <dc:language>${esc(m.language)}</dc:language>`)
  lines.push(`  <dc:rights>${esc(m.licenseName)}</dc:rights>`)

  return `<?xml version="1.0" encoding="UTF-8"?>
<oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/">
${lines.join('\n')}
</oai_dc:dc>`
}

// DC Terms — the qualified/refined Dublin Core vocabulary.
export const toDCTerms = (m) => {
  const lines = []
  lines.push(`  <dcterms:title>${esc(m.title)}</dcterms:title>`)
  m.authors.forEach((a) =>
    lines.push(`  <dcterms:creator>${esc(a.full)}</dcterms:creator>`)
  )
  m.keywords.forEach((k) =>
    lines.push(`  <dcterms:subject>${esc(k)}</dcterms:subject>`)
  )
  if (m.abstract) {
    lines.push(`  <dcterms:abstract>${esc(m.abstract)}</dcterms:abstract>`)
  }
  if (m.publisher) {
    lines.push(`  <dcterms:publisher>${esc(m.publisher)}</dcterms:publisher>`)
  }
  if (m.isoDate) {
    lines.push(
      `  <dcterms:issued xsi:type="dcterms:W3CDTF">${esc(
        m.isoDate
      )}</dcterms:issued>`
    )
  }
  lines.push(`  <dcterms:type xsi:type="dcterms:DCMIType">Text</dcterms:type>`)
  lines.push(
    `  <dcterms:format xsi:type="dcterms:IMT">text/html</dcterms:format>`
  )
  lines.push(
    `  <dcterms:identifier xsi:type="dcterms:URI">${esc(
      m.doi ? 'https://doi.org/' + m.doi : m.url
    )}</dcterms:identifier>`
  )
  if (m.issn) {
    lines.push(
      `  <dcterms:isPartOf>${esc(m.journalName)}${
        m.issn ? ' (ISSN ' + esc(m.issn) + ')' : ''
      }</dcterms:isPartOf>`
    )
  }
  lines.push(`  <dcterms:language>${esc(m.language)}</dcterms:language>`)
  lines.push(
    `  <dcterms:license xsi:type="dcterms:URI">${esc(
      m.license
    )}</dcterms:license>`
  )
  lines.push(`  <dcterms:rights>${esc(m.licenseName)}</dcterms:rights>`)

  return `<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
${lines.join('\n')}
</metadata>`
}

// DataCite — the Metadata Schema 4.x XML used for DOI registration.
export const toDataCite = (m) => {
  const creators = m.authors
    .map(
      (a) =>
        `    <creator>\n` +
        `      <creatorName nameType="Personal">${esc(a.family)}, ${esc(
          a.given
        )}</creatorName>\n` +
        (a.given ? `      <givenName>${esc(a.given)}</givenName>\n` : '') +
        (a.family ? `      <familyName>${esc(a.family)}</familyName>\n` : '') +
        (a.orcid
          ? `      <nameIdentifier nameIdentifierScheme="ORCID" schemeURI="https://orcid.org">${esc(
              a.orcid
            )}</nameIdentifier>\n`
          : '') +
        (a.affiliation
          ? `      <affiliation>${esc(a.affiliation)}</affiliation>\n`
          : '') +
        `    </creator>`
    )
    .join('\n')

  const subjects = m.keywords.length
    ? `  <subjects>\n` +
      m.keywords.map((k) => `    <subject>${esc(k)}</subject>`).join('\n') +
      `\n  </subjects>\n`
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<resource xmlns="http://datacite.org/schema/kernel-4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://datacite.org/schema/kernel-4 http://schema.datacite.org/meta/kernel-4.4/metadata.xsd">
${
  m.doi ? `  <identifier identifierType="DOI">${esc(m.doi)}</identifier>\n` : ''
}  <creators>
${creators}
  </creators>
  <titles>
    <title xml:lang="${esc(m.language)}">${esc(m.title)}</title>
  </titles>
  <publisher>${esc(m.publisher)}</publisher>
  <publicationYear>${esc(m.year)}</publicationYear>
  <resourceType resourceTypeGeneral="JournalArticle">Journal article</resourceType>
${subjects}  <dates>
    <date dateType="Issued">${esc(m.isoDate)}</date>
  </dates>
  <language>${esc(m.language)}</language>
${
  m.issn
    ? `  <relatedIdentifiers>\n    <relatedIdentifier relatedIdentifierType="ISSN" relationType="IsPartOf">${esc(
        m.issn
      )}</relatedIdentifier>\n  </relatedIdentifiers>\n`
    : ''
}  <rightsList>
    <rights rightsURI="${esc(m.license)}">${esc(m.licenseName)}</rights>
  </rightsList>
${
  m.abstract
    ? `  <descriptions>\n    <description descriptionType="Abstract">${esc(
        m.abstract
      )}</description>\n  </descriptions>\n`
    : ''
}</resource>`
}
