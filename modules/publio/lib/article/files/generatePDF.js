import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import PrinterPkg from 'pagedjs-cli'
import { PDFDocument as Document } from 'pdf-lib'
import chalk from 'chalk'

// pagedjs-cli ships an ESM default export; under some interop it lands on
// `.default`. Normalise so this works in both the Nuxt build and plain Node.
const Printer = PrinterPkg.default || PrinterPkg

// Resolve sibling asset paths relative to this file regardless of CWD, so the
// stylesheet and handlers are found whether invoked from the Nuxt build or the
// standalone `yarn pdf` script.
const HERE = path.dirname(fileURLToPath(import.meta.url))

// Print stylesheet injected on top of the page's own styles, and the
// browser-side paged.js handlers (TOC, inline footnotes, URL wrapping).
const PAGED_CSS = path.resolve(HERE, '../../../css/pdf-paged.css')
const PAGED_HANDLERS = path.resolve(HERE, 'pagedHandlers/pagedHandlers.js')

/**
 * Generate a single article PDF with paged.js (via pagedjs-cli's Printer),
 * then top up the few PDF Info-dictionary fields the CLI doesn't take from the
 * page's <meta> tags.
 *
 * Keeps the original signature and return shape so makeFiles/index.js and the
 * Nuxt generate hooks need no changes.
 *
 * @param {object} route  print route descriptor ({ route, file, keep, meta })
 * @param {string} url    base URL the print pages are served from
 * @param {object} meta   shared accumulator (passed through unchanged)
 */
export default async (route, url, meta) => {
  let printer = null
  try {
    const target = `${url.replace(/\/$/, '')}${route.route}`
    console.log('pdf: paginating with paged.js →', target)

    printer = new Printer({
      // The print routes are served over http from our local static server
      // (see lib/article/files/index.js); allow remote, and pass the sandbox
      // flags the CI runners need (pagedjs-cli's defaults omit --no-sandbox).
      allowRemote: true,
      allowLocal: true,
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      // Our print pages are statically pre-rendered; give pagination room on
      // long articles instead of timing out (0 = no timeout).
      timeout: 0,
      styles: [PAGED_CSS],
      additionalScripts: [PAGED_HANDLERS],
    })

    // Surface paged.js rendering stats (page count + time) in the build log.
    printer.on('rendered', (msg) => console.log('pdf:', msg))

    // outlineTags → PDF bookmarks/outline built from these headings.
    // Must be an array — pagedjs-cli's outline parser does `tags.join(',')`.
    const bytes = await printer.pdf(target, {
      outlineTags: ['h1', 'h2', 'h3'],
    })

    // ---- Thin pdf-lib top-up -------------------------------------------------
    // pagedjs-cli already sets Title/Author/Subject/Keywords from <meta> and a
    // sensible Creator/Producer. We override the few fields it can't derive:
    //   - CreationDate from the article's frontmatter (it otherwise uses now())
    //   - Producer to the journal's branded string
    //   - Language from the route locale
    // updateMetadata:false stops pdf-lib from stamping Producer="pdf-lib" and
    // ModDate=now() at load time (it does so in updateInfoDict on load), which
    // would otherwise clobber the Producer we set just below.
    const document = await Document.load(bytes, { updateMetadata: false })

    if (route.meta) {
      if (route.meta.creationDate) {
        const created = new Date(route.meta.creationDate)
        if (!isNaN(created.getTime())) document.setCreationDate(created)
      }
      if (route.meta.producer) document.setProducer(route.meta.producer)
      // Creator otherwise defaults to the headless Chromium user-agent string
      // (+ " + Paged.js"); set the branded value built in makePrintRoutes.
      if (route.meta.creator) document.setCreator(route.meta.creator)
      if (route.meta.author) {
        document.setAuthor(route.meta.author.replace(/&nbsp;/g, ' '))
      }
      if (route.meta.keywords && route.meta.keywords.length) {
        document.setKeywords(route.meta.keywords)
      }
      if (route.meta.language) document.setLanguage(route.meta.language)
    }

    // Serialize once — save() returns a Uint8Array.
    const pdfBytes = await document.save()

    const writeTo = (file) => {
      fs.mkdirSync(file.substring(0, file.lastIndexOf('/')), {
        recursive: true,
      })
      fs.writeFileSync(file, pdfBytes)
    }

    if (route.outDir) {
      // Single-target override (used by the standalone `yarn pdf` script, e.g.
      // to drop test PDFs in static/test/). Skips the build-only dual-write.
      writeTo(path.resolve(route.outDir, route.file))
    } else {
      // 1) Write into the build output so this run's S3 deploy includes the PDF
      //    (S3 sync source is `dist/`). Nuxt's static-copy step runs before
      //    publio's generate:done hook, so writing here directly is the only way
      //    to get same-run shipping. Path must be `dist/pdfs/` so it matches the
      //    public URL convention (/pdfs/<slug>.pdf).
      writeTo(path.resolve('dist/pdfs', route.file))

      // 2) Write into static/pdfs so the retro-push step copies it back to the
      //    submodule's `pdfs/` directory (where the canonical archive lives) and
      //    so the Zenodo upload step (publishOnZenodo) finds it. Synchronous
      //    write so the file is fully flushed before either downstream step reads.
      writeTo(path.resolve('static/pdfs', route.file))
    }

    if (!route.keep && process.env.NODE_ENV === 'production') {
      fs.unlinkSync(`./dist${route.route}/index.html`)
      console.log(
        `${chalk.green('✔')}  Removed route index file used for PDF at ${
          route.route
        }`
      )
    }
    console.log(`${chalk.green('✔')}  PDF written: ${route.file}`)
  } catch (e) {
    console.error(
      'generatePDF failed for route=' + route.route + ' file=' + route.file,
      '-',
      (e && e.message) || e
    )
    if (e && e.stack) console.error(e.stack)
  } finally {
    if (printer !== null) {
      // pdf() only closes the page, not the browser, so we must close the
      // Printer here to release Chromium. Idempotent: close() no-ops if the
      // browser is already gone (e.g. after a mid-render failure).
      try {
        await printer.close()
      } catch (_) {
        /* already closed */
      }
    }
  }
  return [route, url, meta, printer]
}
