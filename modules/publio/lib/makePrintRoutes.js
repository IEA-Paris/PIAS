import { formatAuthors } from '../utils/transforms'

export default (articles, options) => {
  const interesting = (articles || []).filter(
    (a) => a?.todo?.generatePDF || a?.todo?.generateGraph
  )
  console.error(
    '[publio-diag] makePrintRoutes input count=' +
      (articles?.length || 0) +
      ' interesting=' +
      interesting.length
  )
  for (const a of interesting) {
    console.error(
      '[publio-diag] makePrintRoutes interesting slug=' + JSON.stringify(a.slug),
      'generatePDF=' + !!a?.todo?.generatePDF,
      'generateGraph=' + !!a?.todo?.generateGraph,
      'custom_pdf=' + JSON.stringify(a.custom_pdf),
      'picture=' + !!a.picture,
      'yt=' + !!a.yt
    )
  }
  const pdfArticles = articles.filter((article) => {
    return !article.custom_pdf && article?.todo?.generatePDF
  })
  console.error(
    '[publio-diag] makePrintRoutes pdfArticles count=' + pdfArticles.length,
    'slugs=' + JSON.stringify(pdfArticles.map((a) => a.slug))
  )
  const thumbnailArticles = articles.filter((article) => {
    return !article.picture && !article.yt && article?.todo?.generateGraph
  })
  console.error(
    '[publio-diag] makePrintRoutes thumbnailArticles count=' +
      thumbnailArticles.length,
    'slugs=' + JSON.stringify(thumbnailArticles.map((a) => a.slug))
  )
  return {
    pdfs: pdfArticles.map((article) => {
      // if the file has been changed
      return {
        // Route to content that should be converted into pdf.
        route: '/print/' + article.slug,
        file: article.slug + '.pdf',
        // Default option is to remove the route after generation so it is not accessible
        keep: false, // defaults to false
        // Specifify language for pdf. (Only when i18n is enabled!)
        // TODO : make it work with any language
        locale: article.language === 'English' ? 'en' : 'fr',
        // Override global meta with individual meta for each pdf.
        meta: {
          title: article.article_title,

          author: formatAuthors(article.authors).replace('&nbsp;', ' '),
          producer: options.config.name + ' - ' + options.config.full_name,

          // Control the date the file is created.
          creationDate: article.createdAt,

          keywords: article.tags || [],
          language: article.language || 'en',
        },
      }
    }),
    thumbnails: thumbnailArticles.map((article) => {
      // if the file has been changed
      return {
        // Route to content that should be converted into pdf.
        route: '/print/' + article.slug + '/graph',
        file: article.slug + '.png',
        // Default option is to remove the route after generation so it is not accessible
        keep: false, // defaults to false
        // TODO : make it work with any language
        locale: article.language === 'English' ? 'en' : 'fr',
        // Override global meta with individual meta for each pdf.
        meta: {
          title: article.article_title,

          author: formatAuthors(article.authors).replace('&nbsp;', ' '),
          // TODO complete and change produced depending on the journal
          producer: options.config.name + ' - ' + options.config.full_name,

          // Control the date the file is created.
          creationDate: article.createdAt,

          keywords: article.tags || [],
          language: article.language || 'en',
        },
      }
    }),
  }
}
