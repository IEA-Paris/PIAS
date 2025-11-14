export default async (articles) => {
  const util = require('node:util')
  const fs = require('fs')
  const path = require('path')
  const exec = util.promisify(require('node:child_process').exec)

  console.log('=== DIAGNOSE ARTICLES DEBUG ===')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('LOCAL:', process.env.LOCAL)
  console.log('static/thumbnails/ exists:', fs.existsSync('static/thumbnails'))
  console.log('static/svg/ exists:', fs.existsSync('static/svg'))
  if (fs.existsSync('static/thumbnails')) {
    console.log(
      'static/thumbnails/ file count:',
      fs.readdirSync('static/thumbnails').length
    )
  }
  if (fs.existsSync('static/svg')) {
    console.log('static/svg/ file count:', fs.readdirSync('static/svg').length)
  }
  console.log('================================\n')

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
    // Check for PDF in static/pdfs
    const resolvedPDFPath = path.resolve('static/pdfs', article.slug + '.pdf')

    // Check for thumbnails (PNG) in static/thumbnails
    const resolvedThumbnailPath = path.resolve(
      'static/thumbnails',
      article.slug + '.png'
    )

    // Check for SVG in static/svg
    const resolvedSVGPath = path.resolve('static/svg', article.slug + '.svg')

    let hasPDF = false
    if (fs.existsSync(resolvedPDFPath)) {
      hasPDF = true
    } else {
      count++
    }
    let hasThumbnail = false
    // Check for both PNG and SVG thumbnails in static directories
    const hasPNG = fs.existsSync(resolvedThumbnailPath)
    const hasSVG = fs.existsSync(resolvedSVGPath)
    if (hasPNG && hasSVG) {
      hasThumbnail = true
      console.log(
        'Article already has thumbnail, removing countMap from',
        article.article_title
      )
      delete article.countMap
      delete article.countRefs
    }
    if (articleDiffed || !hasPDF) {
      console.log('resolvedPDFPath: ', resolvedPDFPath)
      console.log('articleDiffed: ', articleDiffed)
      console.log('hasPDF: ', hasPDF)
      console.log('article: missing pDF', article.article_title)
    }
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
