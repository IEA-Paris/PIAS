import Citation from 'citation-js'
import PQueue from 'p-queue'

import {
  generateChecksum,
  updateArticlesDoiAndZid,
  deepEqual,
  cleanupString,
} from '../../../utils/contentUtilities'

/// See main fn rationale below the subfunctions
export default async (articles, options) => {
  const { config } = options
  const currentDocument = true
  try {
    const fs = require('fs')
    const path = require('path')
    const Zenodo = require('../../../utils/ZenodoConnector')
    const zenodo = await new Zenodo({
      host: config.modules.zenodo.sandbox ? 'sandbox.zenodo.org' : 'zenodo.org',
      token: config.modules.zenodo.token,
      protocol: 'https',
    })
    // Prepare a queue to avoid rate limiting mechanisms or RAM overconsumption
    const queue = new PQueue({
      concurrency: 3,
      intervalCap: 30,
      interval: 6000,
    })
    // fetch all our Zenodo records
    // ~~TODO deal with the number of articles beyond 1k. I assume the md based system will show its limitations before we reach it.
    // or maybe use the deposition "retrieve" method to proceed one by one~~ //
    /*     const records = await zenodo.depositions.list({
      size: 10000,
    }) */
    // could have done some levenshtein distance metrics but feeling it could lead to unintended false positives
    // NOTE: hasSameTitle is not used for now
    const hasSameFrontmatter = (data = [], document) =>
      deepEqual(document, data)

    const hasSameChecksum = (data = [], document) =>
      data.files &&
      data.files.length &&
      data.files.find((file) => file.checksum === document.checksum)
    /* 
    const hasSameIdOrDoi = (data = [], document) =>
      data.find(
        (article) =>
          (article.id &&
            document.Zid &&
            article.id === document.Zid.toString()) ||
          (document.DOI &&
            article.metadata.doi &&
            article.metadata.doi === document.DOI)
      ) */
    const createArticleOnZenodo = async (document) => {
      const metadata = await buildZenodoDocument(document)
      // used to debug using postman-like extensions:
      /*     console.log('metadata: ', metadata) */

      if (document.fileBuffer) {
        // file exists
        const entry = await zenodo.depositions.create({ metadata })

        console.log(`deposition created on Zenodo  for ${document.slug} `)
        await zenodo.files.upload({
          filename: document.slug + '.pdf',
          data: document.fileBuffer,
          deposition: entry.data,
        })
        console.log(`PDF file uploaded on Zenodo for ${document.slug} `)

        const result = await zenodo.depositions.publish({
          id: entry.data.id,
        })
        console.log(`${document.slug} successfully published on Zenodo `)
        document.DOI = result.data.doi // TODO change once we're out of sandbox or toggle this based on the config file future sandbox flag
        document.Zid = result.data.id
      } else {
        console.log(
          'No deposition published on Zenodo : No file available to upload for ',
          document.slug
        )
      }
      return document
    }
    const buildZenodoDocument = async (document) => {
      const references = document.biblioFile
        ? // sorry for the lack of functionalism :p
          new Citation(
            await fs.readFileSync('./static/' + document.biblioFile, 'utf8')
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
      const metadata = {
        upload_type: 'publication',
        description: document.abstract || 'No description provided',
        publication_type: 'article',
        ...(document.tags && { keywords: document.tags }),
        references,
        language: 'eng', // TODO bind to i18n config settings
        access_right: 'open',
        license: 'CC-BY-NC-4.0',
        // TODO handle the following conditionnaly (i.e. if relevant)
        // cf https://developers.zenodo.org/?shell#representation
        // conference_title:
        // conference_acronym
        // conference_dates
        // conference_place
        // conference_url
        // conference_session
        // location: [{"lat": 34.02577, "lon": -118.7804, "place": "Los Angeles"}, {"place": "Mt.Fuji, Japan", "description": "Sample found 100ft from the foot of the mountain."}]
        // TODO uncomment this once we are out of sandbox. Test DOI trigger a 400 (bad request error) since they are not legit
        // ...(document.DOI && { doi: document.DOI }),
        ...(document.issue && {
          journal_issue: document.issue.slice(15, -3),
        }),
        communities: [
          {
            identifier: config.modules.zenodo.community,
          },
        ],
        journal_title: cleanupString(config.full_name),
        prereserve_doi: document.needDOI !== false,
        publication_date: new Date(document.date).toLocaleDateString('en-US', {
          timezone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
        // TODO
        // - add DOI and ISSN as related identifiers (extra),
        // - same issue articles,
        // - cites relation (when a DOI is provided in the citation)
        // - as well as semantic stuff
        //  e.g.  related_identifiers: [{'relation': 'isPartOf', 'identifier':'2826-2832'},{'relation': 'isSupplementTo', 'identifier':'10.1234/foo'}, {'relation': 'cites', 'identifier':'https://doi.org/10.1234/bar', 'resource_type': 'image-diagram'}]
        //     [
        // {identifier: 'ISSN': '2826-2832'}
        //     ],
        title: document.article_title,
        creators: document.authors.map((item) => {
          // TODO include all title & institution info
          return {
            name: item.lastname.trim() + ', ' + item.firstname.trim(),
            ...(item.positions_and_institutions &&
              item.positions_and_institutions[0] &&
              item.positions_and_institutions[0].institution && {
                affiliation: item.positions_and_institutions[0].institution,
              }),
            ...(item?.orcid && { orcid: item.orcid }),
          }
        }),
      }
      return metadata
    }

    const generateDOI = async (document) => {
      // Rationale of the below function
      /*
    We want to upsert a document in Zenodo.
    First, we check if the document actually exists as a PDF, since you can't get a DOI for metadata only
    Second, we pull all the records from Zenodo (along with pdf hash as well as some zenodo id)
    If the title & DOI already exists on Zenodo, we use the pdf file checksum to see if a revision is needed
    If not, we create the new document on Zenodo along with the related PDF and all the associated metadata.
    Note that when created, only documents with the attribute "needDOI" set to *true* will get a generated DOI.
    */

      // check if the file exists
      if (
        fs.existsSync(
          path.resolve(
            process.env.NODE_ENV !== 'production' ? 'static/pdfs' : 'pdfs',
            document.custom_pdf ? document.custom_pdf : document.slug + '.pdf'
          )
        )
      ) {
        /*  console.log('PDF FILE EXISTS FOR ', document.article_title) */
        // file exists, let's proceed
        document.fileBuffer =
          (await fs.readFileSync(
            path.resolve(
              process.env.NODE_ENV !== 'production' ? 'static/pdfs' : 'pdfs',
              document.custom_pdf ? document.custom_pdf : document.slug + '.pdf'
            )
          )) || false
        // get PDF checksum
        document.checksum = generateChecksum(document.fileBuffer)
        /*    console.log('document.checksum : ', document.checksum) */
        // Compare DOI and Zenodo document id
        let sameIdOrDoi = document.Zid
          ? (
              await zenodo.depositions.retrieve({
                id: document.Zid,
              })
            ).data
          : false
        /*  console.log('sameIdOrDoi: ', sameIdOrDoi) */
        // check if the article already exists on Zenodo:
        if (sameIdOrDoi) {
          // we found the matching article on Zenodo
          const sameFrontmatter = hasSameFrontmatter(
            sameIdOrDoi.metadata,
            await buildZenodoDocument(document)
          )
          if (sameFrontmatter) {
            console.log(
              'Frontmatter is identical in the Zenodo and local versions of ',
              document.article_title
            )
            // no changes in the frontmatter, let's check if the body of the article (pdf checksum) has changed
            // Compare checksum
            if (hasSameChecksum(sameIdOrDoi || [], document)) {
              // the pdf file didn't change, neither did the frontmatter, let's skip it
              console.log('No changes to be done for ', document.article_title)
            } else {
              // Same frontmatter but different PDF. Let's update it.
              // No matching article on Zenodo, we create it
              console.log(
                'NO article matching on Zenodo for ',
                document.article_title,
                ' - generating new document'
              )
              document = await createArticleOnZenodo(document)
              console.log(
                'Zenodo record generated for : ',
                document.article_title
              )
              await updateArticlesDoiAndZid(document)
            }
          } else if (hasSameChecksum(sameIdOrDoi || [], document)) {
            /*     console.log('document: ', sameIdOrDoi) */
            /*     console.log(
              "no changes to the pdf but frontmatter is different, we'll update only if significant changes (i.e. regenerating pdf) occur.",
              document.Zid
            ) */
            /*             if (sameIdOrDoi.state === 'done') {
              try {
                console.log('unlocking edit')
                await zenodo.depositions.edit({ id: document.Zid })
                console.log('unlocked edit')
              } catch (error) {
                console.log('error when unlocking edit: ', error)
              }
            }
            await zenodo.depositions.update({
              id: document.Zid,
              metadata: await buildZenodoDocument(document),
            })
            console.log('created new version')
            try {
              await zenodo.depositions.publish({
                id: document.Zid,
              })
              console.log(`${document.slug} successfully updated on Zenodo `)
            } catch (error) {
              console.log('error while republishing edited article: ', error)
            } */
          } else {
            // in case the pdf file changed as well, we upload the new one
            console.log('the pdf file changed as well, we upload the new one')
            console.log('document.Zid: ', document.Zid)
            let newDocId
            try {
              newDocId = (
                await zenodo.depositions.newversion({
                  id: document.Zid,
                })
              ).data.links.latest_draft
                .split('/')
                .reverse()[0]
              console.log('unlocked edit (new version)', newDocId)

              // Zenodo forces to create a new document to make a new version
              if (newDocId) {
                sameIdOrDoi = (
                  await zenodo.depositions.retrieve({
                    id: newDocId,
                  })
                ).data
                /* console.log('sameIdOrDoi: ', sameIdOrDoi) */
              } else throw new Error('Failed to create a new version')
              document.Zid = newDocId
            } catch (error) {
              console.log('error creating a new verison: ', error)
            }
            try {
              console.log('sameIdOrDoi.files[0].id: ', sameIdOrDoi.files[0].id)
              await zenodo.files.delete({
                id: sameIdOrDoi.files[0].id,
              })
              console.log('deleted old file')
            } catch (error) {
              console.log('error deleting old file: ', error)
            }
            try {
              await zenodo.files.upload({
                filename: document.slug + '.pdf',
                data: document.fileBuffer,
                deposition: sameIdOrDoi,
              })
            } catch (error) {
              console.log('error uplaodign new file : ')
              console.log(
                'entry: ',
                JSON.stringify({
                  filename: document.slug + '.pdf',
                  data: document.fileBuffer,
                  deposition: sameIdOrDoi,
                })
              )
            }
            try {
              await zenodo.depositions.update({
                id: document.Zid,
                metadata: {
                  filename: document.slug + '.pdf',
                  data: document.fileBuffer,
                  deposition: await buildZenodoDocument(document),
                },
              })
              console.log('Upload done!')
            } catch (error) {
              console.log('error while reupload: ', error)
            }

            console.log('created new version & uploaded new file')
            await zenodo.depositions.publish({
              id: document.Zid,
            })
            console.log(`${document.slug} successfully updated on Zenodo `)
          }
          // update the article with the revison DOI
          await updateArticlesDoiAndZid(document)
          // assuming we wouldn't overwrite an existing DOI
        } else if (!document?.DOI?.length) {
          console.log(
            "his article doesn't exist on Zenodo. Let's create it then."
          )
          // this article doesn't exist on Zenodo. Let's create it then.
          document = await createArticleOnZenodo(document)
          await updateArticlesDoiAndZid(document)
        }
      } else {
        // there is no file to begin with, let's skip the Zenodo step
        // since we can't publish or get a DOI without a file to upload
        // TODO: consider using a blank file either for the sake of pre-attributing a DOI or whatever. No a good idea seen from here.
        /*      console.log(
          'Either an unknown DOI exists or no file is attached to "',
          document.article_title,
          " so let's just SKIP it"
        ) */
      }
      document.fileBuffer = false
      document.checksum = false
      return document
    }

    let count = 0
    queue.on('active', () => {})
    queue.on('completed', (result) => {
      count++
    })
    queue.on('error', (error) => {
      console.error('error', error)
    })
    // filter published articles only. It is done earlier in the fetch but it makes it more resilient
    const input = await articles.filter((article) => article.published)
    await input.forEach(async (document) => {
      await queue.add(async () => await generateDOI(document))
    })
    return true
  } catch (error) {
    console.log('general GetDoI error: ', error)
    console.log('currentDocument: ', currentDocument)
  }
}
