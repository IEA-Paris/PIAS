import Citation from 'citation-js'
import { cleanupString } from '../../../utils/contentUtilities'

// Map a config contributor (which describes its role in free text) onto
// Zenodo's controlled contributor-type vocabulary.
// cf https://developers.zenodo.org/#representation
const CONTRIBUTOR_TYPES = [
  'ContactPerson',
  'DataCollector',
  'DataCurator',
  'DataManager',
  'Distributor',
  'Editor',
  'HostingInstitution',
  'Producer',
  'ProjectLeader',
  'ProjectManager',
  'ProjectMember',
  'RegistrationAgency',
  'RegistrationAuthority',
  'RelatedPerson',
  'Researcher',
  'ResearchGroup',
  'RightsHolder',
  'Sponsor',
  'Supervisor',
  'WorkPackageLeader',
  'Other',
]
const mapContributorType = (item) => {
  // Normalise the config role (e.g. "Hosting institution") to a Zenodo type
  // (e.g. "HostingInstitution") by stripping whitespace/casing.
  const normalised = (item.role || item.type || '')
    .replace(/[\s_-]/g, '')
    .toLowerCase()
  return (
    CONTRIBUTOR_TYPES.find((type) => type.toLowerCase() === normalised) ||
    'HostingInstitution'
  )
}

export default (document, options) => {
  const fs = require('fs')
  const references = document.biblioFile
    ? // sorry for the lack of functionalism :p
      new Citation(
        fs.readFileSync('./static/' + document.biblioFile, 'utf8')
      ).data.map((item) =>
        new Citation(item)
          .format('bibliography', {
            format: 'text',
            template: 'apa',
            lang: 'en-US',
          })
          // to avoid html relics in Zenodo
          .replace('\n', '')
      )
    : []
  console.log(
    'new Date(document.date).toISOString().substring(0, 10): ',
    new Date(document.date).toISOString().substring(0, 10)
  )

  const metadata = {
    upload_type: 'publication',
    description: document.abstract || 'No description provided',
    publication_type:
      document?.type === 'article' ? 'article' : 'conferencepaper',
    ...(document.tags && { keywords: document.tags }),
    references,
    record_url: options.config.url + '/article/' + document.slug,
    language: 'eng', // TODO bind to i18n config settings
    access_right: 'open',
    license: 'CC-BY-NC-4.0',
    // TODO handle the following conditionnaly (i.e. if relevant)
    // cf https://developers.zenodo.org/?shell#representation
    // conference_title:
    // conference_acronym
    // location: [{"lat": 34.02577, "lon": -118.7804, "place": "Los Angeles"}, {"place": "Mt.Fuji, Japan", "description": "Sample found 100ft from the foot of the mountain."}]
    ...(document.DOI ? { doi: document.DOI } : {}),
    // Zenodo rejects (400) when both `doi` and `prereserve_doi` are sent.
    // Only ask Zenodo to mint a DOI when the article doesn't already carry one.
    ...(document.DOI
      ? {}
      : { prereserve_doi: document.needDOI !== false }),
    ...(document.issue && {
      journal_issue:
        options.filters.issue.items.find(
          (item) => item.value === document.issue.slice(15, -3)
        )?.text || document.issue.slice(15, -3),
    }),
    conference_dates: new Date(document.date).toLocaleDateString('en-US', {
      timezone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    conference_place:
      document.location ||
      options.config.address ||
      "17, Quai d'Anjou 75004 PARIS - FRANCE",
    ...(document.issue && {
      conference_title:
        options.filters.issue.items.find(
          (item) => item.value === document.issue.slice(15, -3)
        )?.text || document.issue.slice(15, -3),
    }),
    conference_url:
      options.config.url + '/issue/' + encodeURI(document.issue.slice(15, -3)),
    // TODO
    // conference session > to the subissue
    // conference part (see if subissue or session takes over)
    communities: [
      /* TODO add once the official release is done { identifier: 'publiio' } */
      {
        identifier: options.config.modules.zenodo.community,
      },
    ],
    journal_title: cleanupString(options.config.full_name),
    ...(document.issueIndex && { journal_volume: document.issueIndex }),
    publication_date: new Date(document.date).toISOString().substring(0, 10),
    // Zenodo has no dedicated ISSN field; the journal's ISSN is declared as
    // a related identifier (the article isPartOf the journal serial).
    // cf https://developers.zenodo.org/#representation
    ...(options.config.identifier?.ISSN && {
      related_identifiers: [
        {
          relation: 'isPartOf',
          scheme: 'issn',
          identifier: options.config.identifier.ISSN,
        },
      ],
    }),
    // Recommended info: publisher of the proceedings (from config).
    ...(options.config.publisher && {
      imprint_publisher: options.config.publisher,
    }),
    // Recommended info: contributors declared in config (e.g. hosting
    // institution). Map the config `role`/`type` onto Zenodo's controlled
    // contributor-type vocabulary, defaulting to HostingInstitution.
    ...(options.config.contributors?.length && {
      contributors: options.config.contributors.map((item) => ({
        name: item.name,
        type: mapContributorType(item),
      })),
    }),
    // The publication date from the markdown front-matter is carried by
    // `publication_date` above. We intentionally do NOT emit a `dates` entry:
    // Zenodo's legacy deposit API silently drops the start/end of a single
    // point interval, leaving a meaningless `{ type: 'valid' }` on the record.
    // TODO
    // - same issue articles,
    // - cites relation (when a DOI is provided in the citation)
    // - as well as semantic stuff
    //  e.g.  related_identifiers: [{'relation': 'isPartOf', 'identifier':'2826-2832'},{'relation': 'isSupplementTo', 'identifier':'10.1234/foo'}, {'relation': 'cites', 'identifier':'https://doi.org/10.1234/bar', 'resource_type': 'image-diagram'}]

    title: document.article_title,
    creators: document.authors.map((item) => {
      // Zenodo's `affiliation` is a single string, so concatenate every
      // institution declared in the author's frontmatter (deduplicated,
      // trimmed) rather than keeping only the first one.
      const affiliation = (item.positions_and_institutions || [])
        .map((p) => p?.institution?.trim())
        .filter(Boolean)
        .filter((inst, index, all) => all.indexOf(inst) === index)
        .join('; ')
      return {
        name:
          item.lastname.trim() +
          (item.is_institution ? '' : ', ' + item.firstname?.trim()),
        ...(affiliation && { affiliation }),
        ...(item?.orcid && { orcid: item.orcid }),
      }
    }),
  }
  return metadata
}
