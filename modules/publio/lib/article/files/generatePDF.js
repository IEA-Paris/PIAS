const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const { PDFDocument: Document } = require('pdf-lib')
const chalk = require('chalk')
export default async (route, url, meta) => {
  let browser = null
  let response
  try {
    console.error(
      '[publio-diag] generatePDF starting',
      url.replace(/\/$/, '') + route.route,
      'file=' + route.file
    )
    // --no-sandbox / --disable-setuid-sandbox: required on Ubuntu 24.04 GitHub
    // runners where unprivileged user namespaces are restricted and Chromium's
    // sandbox can't initialize. Safe in this CI context — we only render our
    // own trusted print pages.
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setViewport(
      // Pixel equivalent of an A4 page with 300dpi
      { width: 2480, height: 3508, deviceScaleFactor: 1 }
    )
    response = await page.goto(`${url.replace(/\/$/, '')}${route.route}`, {
      waitUntil: ['networkidle0'],
    })
    console.error(
      '[publio-diag] generatePDF page.goto status=' + (response && response.status()),
      'ok=' + (response && response.ok()),
      'url=' + (response && response.url())
    )

    /*     // workaround to allow SVGs to render before the page is saved as PDF
    const loaded = page.waitForNavigation({
      waitUntil: 'load',
    })
    await loaded */
    /*     if (options.viewport || route.viewport) {
      page.setViewport(
        Object.assign(
          {},
          {
            ...options.viewport,
            ...route.viewport,
          }
        )
      )
    } */

    // Generate pdf based on dom content. (result by bytes)
    const bytes = await page.pdf(
      Object.assign(
        {},
        {
          /*  ...options.pdf, */
          ...route.pdf,
          displayHeaderFooter: true,
          footerTemplate: `
            <div style="z-index: 1000; width: 100%; font-size: 8px!important;padding: 0px 5px 0; position: relative;">
              <div style="position: absolute; right: 5px; top: 0px;">
                <span class="pageNumber"></span> of <span class="totalPages"></span>
              </div>
            </div>`,
          margin: { bottom: '50px' },
        }
      )
    )

    // Load bytes into pdf document, used for manipulating meta of file.
    const document = await Document.load(bytes)
    /*    console.log('setup PDF metadata') */
    // Set the correct meta for pdf document.
    if ('title' in route.meta && route.meta.title !== '') {
      document.setTitle(
        (route.meta.titleTemplate || '%s').replace('%s', route.meta.title)
      )
    } else {
      document.setTitle(await page.title())
    }

    document.setAuthor(route.meta.author.replace('&nbsp;', '') || '')
    document.setSubject(route.meta.subject || '')
    document.setProducer(route.meta.producer || '')
    document.setCreationDate(new Date(route.meta.creationDate) || new Date())
    document.setKeywords(route.meta.tag || [])
    document.setLanguage(route.meta.language || '')

    const file = path.resolve('dist', route.file)

    // Create folder where file will be stored.
    fs.mkdirSync(file.substring(0, file.lastIndexOf('/')), {
      recursive: true,
    })

    // Write document to file.
    if (process.env.NODE_ENV === 'production') {
      const ws = fs.createWriteStream(file, { flags: 'w' })
      await ws.write(await document.save())
      await ws.end()
    }
    // also write it in static to commit to source code (used to generate DOI)
    const file2 = path.resolve('static/pdfs', route.file)
    // Create folder where file will be stored.
    /*     console.log('makin PDF folder') */
    fs.mkdirSync(file2.substring(0, file2.lastIndexOf('/')), {
      recursive: true,
    })
    /*    console.log('writing PDF file') */
    const ws2 = fs.createWriteStream(file2, { flags: 'w' })
    await ws2.write(await document.save())
    await ws2.end()
    console.error(
      '[publio-diag] generatePDF wrote',
      file2,
      'exists=' + fs.existsSync(file2),
      'size=' + (fs.existsSync(file2) ? fs.statSync(file2).size : 'N/A')
    )
    if (!route.keep && process.env.NODE_ENV === 'production') {
      fs.unlinkSync(`./dist${route.route}/index.html`)
      console.log(
        `${chalk.green('✔')}  Removed route index file used for PDF at ${
          route.route
        }`
      )
      /*   fs.rmdirSync(`./dist${route.route}`)
      console.log(
        `${chalk.green('✔')}  Removed route directory used for PDF at ${
          route.route
        }`
      ) */
    }
    await page.close()
  } catch (e) {
    console.error(
      '[publio-diag] generatePDF FAILED',
      'route=' + route.route,
      'file=' + route.file,
      'error=' + (e && e.message),
      'stack=' + (e && e.stack)
    )
  } finally {
    if (browser !== null) {
      await browser.close()
    }
  }
  return [route, url, meta, browser]
}
