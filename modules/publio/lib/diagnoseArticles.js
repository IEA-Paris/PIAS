import isOffline from '../utils/isOffline'

export default async (articles) => {
  const util = require('node:util')
  const fs = require('fs')
  const path = require('path')
  const exec = util.promisify(require('node:child_process').exec)
  // In offline dev mode we never generate PDFs/thumbnails/SVGs nor touch
  // Zenodo, so every per-article `todo` flag is forced off below.
  const offline = isOffline()

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

  let gitDiffed = ''

  try {
    // grep exits non-zero when there are no matches (no changed markdown files),
    // so swallow that and treat it as "no diff".
    const { stdout } = await exec(
      "{ git ls-files --others --exclude-standard ; git diff-index --name-only --diff-filter=d HEAD ; } | grep --regexp='[.]md$' || true"
    )
    gitDiffed = stdout || ''
  } catch (error) {
    console.log('No file seems to have changed:', error.message)
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
    // Align `todo` with what `makePrintRoutes` will actually generate:
    // - PDF route is skipped when the article supplies a `custom_pdf`
    // - Thumbnail route is skipped when the article has its own `picture`
    //   or a `yt` (YouTube) poster
    // Flagging the `todo` against those same conditions keeps the diagnostic
    // log honest and avoids pretending we'll touch articles we won't.
    article.todo = {
      gitDiffed: articleDiffed,
      generatePDF:
        !offline && (articleDiffed || !hasPDF) && !article.custom_pdf,
      generateGraph:
        !offline &&
        (articleDiffed || !hasThumbnail) &&
        !article.picture &&
        !article.yt,
      // Always attempt Zenodo sync for articles that want a DOI — the upsert
      // routine itself short-circuits when a matching record already exists
      // on Zenodo, so this is safe and ensures new/changed articles aren't
      // silently skipped just because their PDF is already present locally.
      // (Disabled wholesale in offline dev mode.)
      upsertOnZenodo: !offline && article.needDOI === true,
      obtainDOI: !offline && article.needDOI && !article.DOI?.length,
      publishOnZenodo: false,
    }

    return article
  })
  console.log('PDFs to be generated', count)
  return articles
}
