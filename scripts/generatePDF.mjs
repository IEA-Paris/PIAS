#!/usr/bin/env node
/*
 * Standalone single-article PDF generator — for fast iteration on the paged.js
 * PDF look without running a full `nuxt generate`.
 *
 *   yarn pdf <slug> [slug2 ...]
 *   yarn pdf 1-0-1_Mounier
 *   yarn pdf 1-0-1_Mounier 10_Lahlou
 *
 * It serves the already-built `dist/` directory with node-static (mirroring
 * modules/publio/lib/article/files/index.js) on a local port, then runs the
 * real generatePDF() for each requested slug against
 * http://127.0.0.1:<port>/print/<slug>. Output PDFs land in static/pdfs/ and
 * dist/pdfs/ exactly as in a normal build.
 *
 * Prerequisite: the print routes must exist in dist/. Generate them once with
 * the print index kept:
 *
 *   PUBLIO_KEEP_PRINT=1 yarn generate          (keeps /print/<slug>/index.html)
 *
 * or point at a running dev server instead of dist/:
 *
 *   PDF_BASE_URL=http://127.0.0.1:3000 yarn pdf <slug>
 *
 * Env:
 *   PDF_BASE_URL   base URL to render from (skips the built-in static server)
 *   PDF_PORT       port for the built-in static server (default 3000)
 */
import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import nodeStatic from 'node-static'
import generatePDF from '../modules/publio/lib/article/files/generatePDF.js'
import config from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = Number(process.env.PDF_PORT) || 3000
const DIST = path.join(ROOT, 'dist')
// Optional single output directory. Default: static/pdfs (the canonical archive).
// Set PDF_OUT_DIR to drop PDFs elsewhere, e.g. PDF_OUT_DIR=static/test.
const OUT_DIR = process.env.PDF_OUT_DIR
  ? path.resolve(ROOT, process.env.PDF_OUT_DIR)
  : null

const slugs = process.argv.slice(2).filter(Boolean)

if (!slugs.length) {
  console.error(
    'Usage: yarn pdf <slug> [slug2 ...]\n' +
      'Example: yarn pdf 1-0-1_Mounier 10_Lahlou'
  )
  process.exit(1)
}

// Build the route descriptor generatePDF expects (mirrors makePrintRoutes).
function routeForSlug(slug) {
  return {
    route: '/print/' + slug,
    file: slug + '.pdf',
    keep: true, // never delete the source HTML from this dev script
    // When set, generatePDF writes only here (skips the build dual-write).
    ...(OUT_DIR && { outDir: OUT_DIR }),
    meta: {
      title: slug,
      producer:
        (config.name || 'Publio') +
        (config.full_name ? ' - ' + config.full_name : ''),
      // Mirror the Creator string built in makePrintRoutes.js.
      creator:
        'Antoine Cordelois, Paris Institute for Advanced study, using Nuxt, ' +
        'Publio and Paged.js, for ' +
        (config.publisher || config.full_name || ''),
      // Author/keywords/creationDate are taken from the page <meta> tags by
      // pagedjs-cli; left undefined here so the page wins.
      language: 'en',
    },
  }
}

async function run() {
  const usingExternal = !!process.env.PDF_BASE_URL
  const baseUrl = usingExternal
    ? process.env.PDF_BASE_URL.replace(/\/$/, '')
    : `http://127.0.0.1:${PORT}`

  let server = null

  if (!usingExternal) {
    if (!fs.existsSync(DIST)) {
      console.error(
        `No dist/ found at ${DIST}.\n` +
          'Build the site first (PUBLIO_KEEP_PRINT=1 yarn generate) or set ' +
          'PDF_BASE_URL to a running server.'
      )
      process.exit(1)
    }
    const fileServer = new nodeStatic.Server(DIST)
    server = http.createServer((request, response) => {
      request
        .addListener('end', () => fileServer.serve(request, response))
        .resume()
    })
    await new Promise((resolve) => server.listen(PORT, resolve))
    console.log(`Serving ${DIST} at ${baseUrl}`)
  } else {
    console.log(`Rendering from external server ${baseUrl}`)
  }

  const meta = {}
  let ok = 0
  for (const slug of slugs) {
    // Warn early if the print HTML isn't present when serving dist/.
    if (!usingExternal) {
      const htmlPath = path.join(DIST, 'print', slug, 'index.html')
      if (!fs.existsSync(htmlPath)) {
        console.warn(
          `⚠  ${slug}: ${htmlPath} not found. The print route may have been ` +
            'stripped by a production build. Re-run with PUBLIO_KEEP_PRINT=1 ' +
            'yarn generate, or use PDF_BASE_URL against a dev server.'
        )
      }
    }
    const start = Date.now()
    try {
      await generatePDF(routeForSlug(slug), baseUrl, meta)
      console.log(`✔ ${slug} (${((Date.now() - start) / 1000).toFixed(1)}s)`)
      ok++
    } catch (e) {
      console.error(`✗ ${slug} failed:`, (e && e.message) || e)
    }
  }

  if (server) await new Promise((resolve) => server.close(resolve))
  const dest = OUT_DIR ? path.relative(ROOT, OUT_DIR) + '/' : 'static/pdfs/'
  console.log(`\nDone: ${ok}/${slugs.length} PDF(s) generated → ${dest}`)
  // generatePDF swallows its own errors, so exit non-zero only if all failed.
  process.exit(ok === 0 ? 1 : 0)
}

run().catch((e) => {
  console.error('generatePDF script error:', e)
  process.exit(1)
})
