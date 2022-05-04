export default async (document) => {
  if (
    document.dir.startsWith('/articles') &&
    document.published &&
    document.needDOI &&
    document.ffs &&
    !document.DOI
  ) {
    const Zenodo = require('../lib/ZenodoConnector')
    const zenodo = new Zenodo({
      host: 'sandbox.zenodo.org',
      token: 'OrxfOwmCHDcUrchiaLzqDAqYu0pIMZ96YR88NH0a754LgbIkeixMMTc3rXcK',
      protocol: 'https',
    })
    const fs = require('fs').promises
    const path = require('path')
    const rawfile = path.resolve(
      process.env.NODE_ENV !== 'production' ? 'static/pdfs' : 'pdfs',
      document.slug + '.pdf'
    )
    const file = await fs.readFile(rawfile)
    try {
      const metadata = {
        upload_type: 'publication',
        description: document.abstract || 'No description provided',
        publication_type: 'article',
        ...(document.tags && { keywords: document.tags }),
        // TODO references: add .bib file extract
        // TODO conference_url: TO BE COMPLETED
        language: document.language || 'eng',
        journal_title: 'PIAS', // TODO update for other platforms
        publication_date: new Date(document.createdAt).toLocaleDateString(
          'EN',
          {
            timezone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }
        ),
        access_right: 'open',
        title: document.article_title,
        creators: document.authors.map((item) => {
          // TODO include all title & institution info
          return {
            name: item.lastname + ', ' + item.firstname,
            ...(item.titles_and_institutions &&
              item.titles_and_institutions[0] &&
              item.titles_and_institutions[0].institution && {
                affiliation: item.titles_and_institutions[0].institution,
              }),
            ...(item?.orcid_id && { orcid: item?.orcid_id }),
          }
        }),
      }
      console.log('metadata: ', metadata)

      const entry = await zenodo.depositions.create(metadata)
      console.log(`deposition created for ${document.article_title} `)

      await zenodo.files.upload({
        bucketId:
          entry.data.links.bucket.split('/')[
            entry.data.links.bucket.split('/').length - 1
          ],
        filename: document.slug + '.pdf',
        data: file,
      })
      const result = await zenodo.depositions.publish({
        id: entry.data.id,
      })
      console.log('result: ', result.data)
      return result.data.doi
    } catch (error) {
      console.log('error: ', error)
    }

    // we assume it is markdown
    // make DOI only if the document is published & has no DOI yet & needs a DOI
    return document
  }
}
