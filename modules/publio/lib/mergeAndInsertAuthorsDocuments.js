import fs from 'fs'
import parseMD from 'parse-md'
import { drawEllipse } from 'pdf-lib'
import { filterAndMerge, insertDocuments } from '../utils/contentUtilities'
import config from '../../../config'

export default async (authors = [], articles, content) => {
  try {
    const chalk = require('chalk')

    const authorsDocuments = await content('authors', { deep: true }).fetch()

    const { first, second } = filterAndMerge(authors, authorsDocuments)

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

        const positionsAndInstitutions = []
        // prune empty positions
        rest.positions_and_institutions =
          // make sure it existts
          (rest.positions_and_institutions &&
            // then only keep the ones that have an institution
            Object.keys(rest.positions_and_institutions).map((el) => {
              // only if it has an institution
              if (
                rest.positions_and_institutions[el] &&
                rest.positions_and_institutions[el].institution?.length
              ) {
                // prune positions as well
                rest.positions_and_institutions[el].positions =
                  (rest.positions_and_institutions[el].positions &&
                    Array.isArray(
                      rest.positions_and_institutions[el].positions
                    ) &&
                    rest.positions_and_institutions[el].positions.filter(
                      (el) => el && el.length
                    )) ||
                  []
                positionsAndInstitutions.push(
                  rest.positions_and_institutions[el]
                )
              }
              return el
            })) ||
          []

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
