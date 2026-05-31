import fs from 'fs'
import parseMD from 'parse-md'
import { drawEllipse } from 'pdf-lib'
import {
  filterAndMerge,
  insertDocuments,
  normalizeAuthor,
  pruneEmptyPositions,
} from '../utils/contentUtilities'
import config from '../../../config'

export default async (authors = [], articles, content) => {
  try {
    const chalk = require('chalk')

    const authorsDocuments = await content('authors', { deep: true }).fetch()

    // Normalise both the incoming article authors and the author docs loaded
    // from disk through the same pass (trim names, prune empty positions and
    // empty-institution affiliations) so they merge consistently and any stale
    // empties in already-committed docs self-heal on this run.
    const normalizedAuthors = (authors || []).map(normalizeAuthor)

    // The articles are the source of truth for affiliations. A committed author
    // doc's positions_and_institutions is DERIVED data that may carry historical
    // corruption from the old index-based merge (e.g. a position pooled onto the
    // wrong institution). So for every author that still appears in an article,
    // discard the doc's stored affiliations and rebuild them purely from the
    // articles. Authors with no current article keep their doc affiliations
    // (there is nothing fresher to derive them from).
    const identityKey = (a) =>
      a?.is_institution
        ? 'inst:' + (a.lastname || '').trim().toLowerCase()
        : 'person:' +
          (a.firstname || '').trim().toLowerCase() +
          '|' +
          (a.lastname || '').trim().toLowerCase()
    const articleAuthorIds = new Set(normalizedAuthors.map(identityKey))
    const normalizedDocuments = (authorsDocuments || [])
      .map(normalizeAuthor)
      .map((doc) =>
        articleAuthorIds.has(identityKey(doc))
          ? { ...doc, positions_and_institutions: [] }
          : doc
      )

    const { first, second } = filterAndMerge(
      normalizedAuthors,
      normalizedDocuments
    )

    const updatedAuthorsDocuments = [...(first || []), ...(second || [])].map(
      (item) => {
        const { createdAt, ...rest } = item // remove createdAt property
        // Keep only the article slugs that still correspond to an existing,
        // published article — and de-duplicate. publio otherwise only ever
        // *appends* to an author's `articles` list, so renamed (e.g. slugified),
        // deleted or unpublished articles would linger forever as stale entries.
        const authorArticles = Array.from(
          new Set(
            (item?.articles || []).filter((article) =>
              articles.some((art) => art.slug === article && art.published)
            )
          )
        )

        // Derive the author's `issue` list from their live articles rather than
        // trusting the accumulated array (same append-only/never-prune problem:
        // it otherwise keeps renamed/spaced issue paths forever). Each article
        // carries its issue path (`content/issues/<slug>.md`), so the set of
        // issues an author belongs to is exactly the issues of their published
        // articles.
        const authorIssue = Array.from(
          new Set(
            authorArticles
              .map(
                (slug) =>
                  articles.find((art) => art.slug === slug && art.published)
                    ?.issue
              )
              .filter(Boolean)
          )
        )

        const fileContents = item.path
          ? fs.readFileSync(
              'submodules/' + config.name + '/content/' + item.path + '.md',
              'utf8'
            )
          : false

        const { content } = fileContents ? parseMD(fileContents) : false

        // Affiliations are already normalised (empty institutions dropped,
        // positions pruned) by normalizeAuthor before the merge, and merged as
        // a deduplicated set by mergeAffiliations. Defensive prune of empty
        // positions in case a single-article author skipped the merge path.
        const positionsAndInstitutions = (rest.positions_and_institutions || [])
          .filter((pi) => pi && String(pi.institution || '').trim())
          .map((pi) => ({
            ...pi,
            institution: String(pi.institution).trim(),
            positions: pruneEmptyPositions(pi.positions),
          }))

        return {
          ...rest,
          text: content || false,
          firstname: (rest.firstname && rest.firstname.trim()) || '',
          lastname: (rest.lastname && rest.lastname.trim()) || '',
          exerpt: rest.text?.length ? rest.text.slice(0, 350) : '',
          active:
            (authorArticles && authorArticles.length > 0) ||
            !!rest.editorial_fellow ||
            !!rest.editorial_committee,
          positions_and_institutions: positionsAndInstitutions,
          articles: authorArticles || [],
          issue: authorIssue,
        }
      }
    )

    insertDocuments(updatedAuthorsDocuments, 'authors', [
      'lastname',
      'firstname',
    ])
    console.log(
      `${chalk.green('✔')}  Inserted ${
        updatedAuthorsDocuments.length
      } new author documents`
    )

    return authors
  } catch (error) {
    console.log('error during mergeAndInsertAuthors: ', error)
  }
}
