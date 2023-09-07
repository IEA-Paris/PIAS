import fs from 'fs'
import parseMD from 'parse-md'
import { filterAndMerge, insertDocuments } from '../utils/contentUtilities'
import config from '../../../config'

export default async (authors = [], articles, content) => {
  try {
    const chalk = require('chalk')

    const authorsDocuments = await content('authors', { deep: true }).fetch()

    const { first, second } = filterAndMerge(authors, authorsDocuments)

    const updatedAuthorsDocuments = [...(first || []), ...(second || [])].map(
      (item) => {
        delete item.createdAt

        const authorArticles = item?.articles.filter((article) =>
          articles.find((art) => !(art.slug === article && art.published))
        )

        const fileContents = item.path
          ? fs.readFileSync(
              'submodules/' + config.name + item.path + '.md',
              'utf8'
            )
          : false

        const { content } = fileContents ? parseMD(fileContents) : false

        return {
          ...item,
          text: content || false,
          firstname: (item.firstname && item.firstname.trim()) || '',
          lastname: (item.lastname && item.lastname.trim()) || '',
          exerpt: item.text?.length ? item.text.slice(0, 350) : '',
          positions_and_institutions:
            item.positions_and_institutions &&
            Object.keys(item.positions_and_institutions).map((el) => {
              return item.positions_and_institutions[el]
            }),
          active: !!authorArticles,
          articles: authorArticles || [],
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
