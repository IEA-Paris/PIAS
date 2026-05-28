const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const { PDFDocument: Document } = require('pdf-lib')
const chalk = require('chalk')
export default async (route, url, meta) => {
  let browser = null
  let response
  try {
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

    // Serialize the PDF once — `document.save()` returns a Uint8Array.
    const pdfBytes = await document.save()

    // 1) Write into the build output so this run's S3 deploy includes the
    //    PDF (S3 sync source is `dist/`). Nuxt's static-copy step runs
    //    before publio's generate:done hook, so writing here directly is
    //    the only way to get same-run shipping. Path must be `dist/pdfs/`
    //    so it matches the public URL convention (/pdfs/<slug>.pdf).
    const distFile = path.resolve('dist/pdfs', route.file)
    fs.mkdirSync(distFile.substring(0, distFile.lastIndexOf('/')), {
      recursive: true,
    })
    fs.writeFileSync(distFile, pdfBytes)

    // 2) Write into static/pdfs so the retro-push step copies it back to
    //    the submodule's `pdfs/` directory (where the canonical archive
    //    lives) and so the Zenodo upload step (publishOnZenodo) finds it.
    //    Synchronous write so the file is fully flushed before either of
    //    those downstream steps reads it.
    const staticFile = path.resolve('static/pdfs', route.file)
    fs.mkdirSync(staticFile.substring(0, staticFile.lastIndexOf('/')), {
      recursive: true,
    })
    fs.writeFileSync(staticFile, pdfBytes)
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
      'generatePDF failed for route=' + route.route + ' file=' + route.file,
      '-',
      (e && e.message) || e
    )
    if (e && e.stack) console.error(e.stack)
  } finally {
    if (browser !== null) {
      await browser.close()
    }
  }
  return [route, url, meta, browser]
}
