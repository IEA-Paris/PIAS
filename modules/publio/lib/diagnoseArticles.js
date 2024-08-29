export default async (articles) => {
  const util = require('node:util')
  const fs = require('fs')
  const path = require('path')
  const exec = util.promisify(require('node:child_process').exec)

  let gitDiffed = false

  try {
    // TODO the following command raises an error if no file has changed. Look into an argument to avoid that, thus removing the try catch block
    const { stdout, stderr } = await exec(
      "{ git ls-files --others --exclude-standard ; git diff-index --name-only --diff-filter=d HEAD ; } | grep --regexp='[.]md$'"
    )
    gitDiffed = stdout
  } catch (error) {
    /*     console.log('error: ', error) */
    console.log('No file seems to have changed')
  } finally {
    gitDiffed = ''
  }
  const diffed = gitDiffed
    .split('\n')
    .filter((str) => str)
    .map((str) => str.slice(7))
  let count = 0
  articles = articles?.map((article) => {
    const articleDiffed = diffed.includes(article.path)
    const resolvedPDFPath = path.resolve(
      process.env.NODE_ENV !== 'production' ||
        (process.env.NODE_ENV === 'production' && process.env.LOCAL === 'true')
        ? 'static/pdfs'
        : 'pdfs',
      article.slug + '.pdf'
    )
    const resolvedThumbnailPath = path.resolve(
      process.env.NODE_ENV !== 'production' ||
        (process.env.NODE_ENV === 'production' && process.env.LOCAL === 'true')
        ? 'static/thumbnails'
        : 'thumbnails',
      article.slug + '.png'
    )
    let hasPDF = false
    if (fs.existsSync(resolvedPDFPath)) {
      hasPDF = true
    } else {
      count++
    }
    let hasThumbnail = false
    if (fs.existsSync(resolvedThumbnailPath)) {
      hasThumbnail = true
      console.log(
        'Article already has thumbnail, removing countMap from',
        article.article_title
      )
      delete article.countMap
      delete article.countRefs
    }
    /*     if (article.slug === 'SynE2_2016_16_obedience-responsibility-punishment')
      console.log('article: ', article) */
    article.todo = {
      gitDiffed: articleDiffed,
      generatePDF: articleDiffed || !hasPDF,
      generateGraph: articleDiffed || !hasThumbnail,
      upsertOnZenodo: articleDiffed || !hasPDF,
      obtainDOI: article.needDOI && !article.DOI?.length,
      publishOnZenodo: false,
    }

    return article
  })
  console.log('PDFs to be generated', count)
  return articles
}
