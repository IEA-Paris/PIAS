import { generateChecksum, deepEqual } from '../../../utils/contentUtilities'
import buildZenodoDocument from './buildZenodoDocument'
/// See main fn rationale below the subfunctions
export default async (articles, options, queue) => {
  try {
    const fs = require('fs')
    const path = require('path')
    const Zenodo = require('../../../utils/ZenodoConnector')
    const zenodo = await new Zenodo({
      host: options.config.modules.zenodo.sandbox
        ? 'sandbox.zenodo.org'
        : 'zenodo.org',
      token: options.config.modules.zenodo.sandbox
        ? options.config.modules.zenodo.sandboxToken
        : options.config.modules.zenodo.token,
      protocol: 'https',
    })
    console.log('UPSERT ON ZENODO', articles?.length)
    // fetch all our Zenodo records
    // make an elastic search query to get only the relevant documents from Zenodo
    /*     const q =
      'doi:' +
      articles
        .map((article) => article.DOI)
        .filter((doi) => doi)
        .join(' OR doi:')
    console.log('Q', JSON.stringify(q)) */
    // Zenodo caps `size` at 100 on the deposit listing endpoint, so paginate.
    const records = await queue.add(async () => {
      console.log('fetching Zenodo records')
      const pageSize = 100
      const all = []
      for (let page = 1; ; page++) {
        const { data } = await zenodo.depositions.list({
          size: pageSize,
          page,
        })
        if (!data?.length) break
        all.push(...data)
        if (data.length < pageSize) break
      }
      console.log(`fetched ${all.length} Zenodo records`)
      return all
    })

    // or pull each record independantly (would be better, but the elastic search query is not working)

    const hasSameFrontmatter = (data, document) => deepEqual(data, document)

    const hasSameChecksum = (data, document) =>
      (data.files &&
        data.files.length &&
        data.files.find((file) => file.checksum === document.checksum)) ||
      false

    const hasSameIdOrDoi = (data, document) => {
      if (!data?.length || (!document?.Zid && !document?.DOI)) return false
      return (
        data.find(
          (article) =>
            (document.Zid && article.id && article.id === document.Zid) ||
            (document.DOI && article.metadata?.doi === document.DOI)
        ) || false
      )
    }

    const upsertArticleOnZenodo = async (document, editMode = false) => {
      const metadata = buildZenodoDocument(document, options)

      return await queue.add(async () => {
        console.log('upsertArticleOnZenodo', metadata.title)
        try {
          const deposition = await (editMode
            ? zenodo.depositions.update({ metadata })
            : zenodo.depositions.create({ metadata }))
          return deposition
        } catch (error) {
          console.error(
            `Zenodo upsert failed for "${metadata.title}" (slug=${document.slug}): ${error.message}`
          )
          if (error.zenodo?.errors) {
            console.error(
              'Zenodo field errors:',
              JSON.stringify(error.zenodo.errors, null, 2)
            )
          }
          console.error(
            'Submitted metadata:',
            JSON.stringify(metadata, null, 2)
          )
          throw error
        }
      })
    }

    const generateDOI = async (document, records) => {
      // Rationale of the below function
      /*
    We want to upsert a document in Zenodo.
    We pull all the records from Zenodo (along with pdf hash + zenodo id)
    If the title & DOI already exists on Zenodo, we use the pdf file checksum and frontmatter deep compare to see if a revision is needed
    If a revision is needed, we create it by unpublishign the article first.
    If not, we create the new document on Zenodo  and all the associated metadata.
    Note that when created, only documents with the attribute "needDOI" set to *true* will get a generated DOI.
    */

      const resolvedPath = path.resolve(
        process.env.NODE_ENV !== 'production' ||
          (process.env.NODE_ENV === 'production' &&
            process.env.LOCAL === 'true')
          ? 'static/pdfs'
          : 'pdfs',
        document.slug + '.pdf'
      )
      // check if the file exists
      if (fs.existsSync(resolvedPath)) {
        document.fileBuffer = fs.readFileSync(resolvedPath)

        // get PDF checksum
        document.checksum = generateChecksum(document.fileBuffer)
        console.log('FOUND a PDF file to upload for ', document.article_title)
      } else {
        console.log(
          'i: ',
          `The PDF related to ${document.slug} does not exist.`
        )
        document.fileBuffer = false
        if (!document.custom_pdf) {
          document.todo.generatePDF = true
        }
      }
      // Compare DOI and Zenodo document id
      const sameIdOrDoi = hasSameIdOrDoi(records, document)
      /*   console.log('sameIdOrDoi: ', sameIdOrDoi) */
      // check if the article already exists on Zenodo:
      if (sameIdOrDoi) {
        /* console.log('sameIdOrDoi: ', sameIdOrDoi) */
        console.log(
          'FOUND articles matching on Zenodo for ',
          document.article_title
        )

        // we found the matching article on Zenodo
        const sameFrontmatter = hasSameFrontmatter(
          buildZenodoDocument(document, options),
          sameIdOrDoi.metadata || {}
        )
        const sameChecksum = hasSameChecksum(sameIdOrDoi || [], document)
        /*  console.log('sameChecksum: ', sameChecksum) */
        if (!sameFrontmatter || !sameChecksum) {
          console.log('Update required on an existing article -DISABLED')
          /*  if (sameIdOrDoi.state === 'done') {
            console.log('unlockingedit')
            await queue.add(async () => {
              return await zenodo.depositions.edit({ id: document.Zid })
            })
            const rst = await queue.add(async () => {
              return await zenodo.depositions.newversion({
                id: document.Zid,
              })
            })
            document.Zid = rst.data.id
          } */
          // since we de-published the article, we need to republish it once the pdf & data is updated
        }
        console.log(
          "Document is not published, let's publish it",
          document?.links
        )
        document.todo.publishOnZenodo = true

        if (sameIdOrDoi.state === 'done') {
          console.log('Document published, nothing is needed')
          document.todo.publishOnZenodo = false
        } else {
          console.log(
            "Document is not published, let's publish it",
            sameIdOrDoi
          )
          document.todo.publishOnZenodo = true
          if (!document?.links?.bucket) {
            console.log("No bucket link, let's add this one", sameIdOrDoi)
            document.links = { bucket: sameIdOrDoi.links.bucket }
          }
        }
      } else if (!document.DOI) {
        // No matching Zenodo record and no existing DOI — safe to mint a new
        // record (Zenodo will assign a fresh DOI via prereserve_doi).
        console.log("article doesn't exist on Zenodo", document.article_title)
        const rst = (await upsertArticleOnZenodo(document)) || false
        if (rst) {
          document.Zid = rst.data.id
          if (rst.data.metadata?.prereserve_doi?.doi) {
            document.DOI = rst.data.metadata.prereserve_doi.doi
          }
          if (rst.data.links?.bucket) {
            document.links = { bucket: rst.data.links.bucket }
          }
          document.todo.publishOnZenodo = true
        }
        if (!document.custom_pdf) {
          document.todo.generatePDF = true
        }

        console.log('document created', document.DOI)
      } else {
        // Article already has a DOI but no matching Zenodo record on this
        // host — do nothing (per project policy: don't re-mint existing DOIs).
        // This usually means the record lives on a different Zenodo host
        // (e.g. prod vs sandbox) or was deleted upstream; either way we leave
        // it alone and surface it for manual investigation.
        console.log(
          'Article has a DOI but no matching Zenodo record on this host — skipping create:',
          document.article_title,
          'DOI=',
          document.DOI
        )
      }
      return document
    }
    articles = await Promise.all(
      articles.map(async (document) => {
        if (
          document.published &&
          document.needDOI === true &&
          document.todo.upsertOnZenodo
        ) {
          console.log('processing article: ', document.article_title)
          console.log('TODO list', document.todo)
          return await generateDOI(document, records)
        } else {
          return document
        }
      })
    )

    return articles
  } catch (error) {
    console.error('error while inserting on Zenodo:', error.message)
    if (error.zenodo?.errors) {
      console.error(
        'Zenodo field errors:',
        JSON.stringify(error.zenodo.errors, null, 2)
      )
    }
  }
  return articles
}
