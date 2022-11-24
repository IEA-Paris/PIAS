const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const { PDFDocument: Document } = require('pdf-lib')
let browser, response
const chalk = require('chalk')
export default async (route, url, meta) => {
  try {
    console.log(
      'starting to generate PDF at ',
      url.replace(/\/$/, '') + route.route
    )
    browser = await puppeteer.launch(
      /*  Object.assign( */
      {
        headless: true,
      }
      /*    options.puppeteer 
      ) */
    )
    console.log('browser started')
    const page = await browser.newPage()
    console.log('page created')
    await page.setViewport(
      // Pixel equivalent of an A4 page with 300dpi
      { width: 2480, height: 3508, deviceScaleFactor: 1 }
    )
    console.log('viewport set', url.replace(/\/$/, ''))

    response = await page.goto(`${url.replace(/\/$/, '')}${route.route}`, {
      waitUntil: 'networkidle0',
    })
    console.log('page goto')
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
            <div style="z-index: 1000; width: 100%; font-size: 8px;padding: 5px 5px 0; position: relative;">
              <div style="position: absolute; right: 5px; top: 5px;">
                <span class="pageNumber"></span> of <span class="totalPages"></span>
              </div>
            </div>`,
          margin: { bottom: '70px' },
        }
      )
    )
    console.log('got pdf bytes')

    // Load bytes into pdf document, used for manipulating meta of file.
    const document = await Document.load(bytes)
    console.log('created document')
    /*    console.log('setup PDF metadata') */
    // Set the correct meta for pdf document.
    if ('title' in route.meta && route.meta.title !== '') {
      document.setTitle(
        (route.meta.titleTemplate || '%s').replace('%s', route.meta.title)
      )
    } else {
      document.setTitle(await page.title())
    }

    document.setAuthor(route.meta.author || '')
    document.setSubject(route.meta.subject || '')
    document.setProducer(route.meta.producer || '')
    document.setCreationDate(new Date(route.meta.creationDate) || new Date())
    document.setKeywords(route.meta.tag || [])
    document.setLanguage(route.meta.language || '')
    console.log('metadata added')

    const file = path.resolve('dist', route.file)
    console.log('create folder')

    // Create folder where file will be stored.
    fs.mkdirSync(file.substring(0, file.lastIndexOf('/')), {
      recursive: true,
    })

    // Write document to file.
    if (process.env.NODE_ENV === 'production') {
      const ws = fs.createWriteStream(file, { flags: 'w' })
      await ws.write(await document.save())
      console.log('wrote pdf 1')
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
    console.log('wrote pdf 2')
    await ws2.end()
    console.log(
      `${chalk.green('✔')}  Generated PDF 
      } at file '${file2} (${document.getTitle()})`
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
    console.log('closing page')
    await page.close()
    console.log('closed page')
  } catch (e) {
    console.log(
      `${chalk.red('𐄂')} Failed to generated PDF 
       at route ${route.route} error: ${e.message}`
    )
  } finally {
    if (browser !== null) {
      await browser.close()
    }
  }
  return [route, url, meta, browser]
}
