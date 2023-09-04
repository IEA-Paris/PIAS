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
    // TODO deal with the number of articles beyond 1k. I assume the md based system will show its limit before we reach it.
    const records = (
      await queue.add(async () => {
        return await zenodo.depositions.list({
          size: 10000,
        })
      })
    ).data

    // or pull each record independantly (would be better, but the elastic search query is not working)

    const hasSameFrontmatter = (data, document) => deepEqual(data, document)

    const hasSameChecksum = (data, document) =>
      (data.files &&
        data.files.length &&
        data.files.find((file) => file.checksum === document.checksum)) ||
      false

    const hasSameIdOrDoi = (data, document) => {
      return data?.length && document?.Zid && document?.DOI
        ? data.find(
            (article) =>
              (article.id && article.id === document.Zid) ||
              article.metadata?.doi === document.DOI
          )
        : false
    }

    const upsertArticleOnZenodo = async (document, editMode = false) => {
      const metadata = buildZenodoDocument(document, options)

      return await queue.add(async () => {
        const deposition = await (editMode
          ? zenodo.depositions.update({ metadata })
          : zenodo.depositions.create({ metadata }))
        return deposition
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
        document.todo.generatePDF = true
      }
      // Compare DOI and Zenodo document id
      const sameIdOrDoi = hasSameIdOrDoi(records, document)
      /*   console.log('sameIdOrDoi: ', sameIdOrDoi) */
      // check if the article already exists on Zenodo:
      if (sameIdOrDoi) {
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
        if (sameIdOrDoi.state !== 'done') {
          console.log(
            "Document is not published, let's publish it",
            document?.links
          )
          document.todo.publishOnZenodo = true
          if (!document?.links?.bucket) {
            console.log("No bucket link, let's add this one", sameIdOrDoi)
            document.links = { bucket: sameIdOrDoi.links.bucket }
          }
        }
      } else {
        // this article doesn't exist on Zenodo. Let's create it then.
        if (!document.DOI) {
          console.log("article doesn't exist on Zenodo", document.article_title)
          const rst = (await upsertArticleOnZenodo(document)) || false
          if (rst) {
            if (!document.Zid) document.Zid = rst.data.id
            if (!document.DOI) {
              document.DOI = rst.data.metadata.prereserve_doi.doi
            }
            if (!document?.links?.bucket) {
              document.links = { bucket: rst.data.links.bucket }
            }
            document.todo.publishOnZenodo = true
          }
        }
        console.log('document?.links?.bucket: ', document?.links?.bucket)
        document.todo.generatePDF = true

        console.log('document created', document.DOI)
      }
      return document
    }
    articles = await Promise.all(
      await articles.map(async (document) => {
        if (document.published && document.needDOI === true) {
          return await generateDOI(document, records)
        } else {
          return document
        }
      })
    )

    return articles
  } catch (error) {
    console.log('error while inserting on Zenodo: ', error)
  }
  return articles
}
