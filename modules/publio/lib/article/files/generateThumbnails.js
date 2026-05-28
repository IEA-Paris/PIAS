import { Blob } from 'node:buffer'
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const sharp = require('sharp')
export default async (route, url, meta) => {
  let browser = null
  let response
  try {
    console.log(
      'starting to generate Thumbnails at ',
      url.replace(/\/$/, '') + route.route
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
    // Reduced viewport size: A4 proportions at 150dpi instead of 300dpi
    // This gives us 1240x1754px which is still high quality but 4x smaller
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 })
    console.log(
      'generating graph thumbnail at route: ',
      `${url.replace(/\/$/, '')}${route.route}`
    )
    response = await page.goto(`${url.replace(/\/$/, '')}${route.route}`, {
      waitUntil: ['networkidle0'],
    })

    const content = await page.$('svg')

    const imageBuffer = await content.screenshot({ omitBackground: true })

    // Always write under static/ for two reasons:
    //   (a) the retro-push rsync mirrors PIAS-root static/{thumbnails,svg}/
    //       back to the submodule's root thumbnails/ and svg/
    //   (b) diagnoseArticles checks `static/thumbnails/<slug>.png` and
    //       `static/svg/<slug>.svg` to decide whether to regenerate
    // Previously this used an env-dependent path that wrote to root-level
    // thumbnails/ in CI, which neither the rsync nor diagnoseArticles
    // looked at — so generated thumbnails were silently abandoned.
    fs.mkdirSync('static/thumbnails', { recursive: true })
    fs.mkdirSync('static/svg', { recursive: true })

    const resolvedThumbnailPath = path.resolve('static/thumbnails', route.file)
    const resolvedSVGPath = path.resolve(
      'static/svg',
      route.file.slice(0, -4) + '.svg'
    )

    // Post-process PNG with Sharp for better compression
    // Quality 85 provides excellent quality with ~40-60% file size reduction
    await sharp(imageBuffer)
      .png({
        quality: 85,
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: true,
      })
      .toFile(resolvedThumbnailPath)

    // Generate WebP version for better performance (60-80% smaller than PNG)
    const resolvedWebPPath = resolvedThumbnailPath.replace('.png', '.webp')
    await sharp(imageBuffer)
      .webp({
        quality: 85,
        effort: 6, // Higher effort = better compression (0-6 scale)
      })
      .toFile(resolvedWebPPath)

    const svgInline = await page.evaluate(
      () => document.querySelector('svg').outerHTML
    )
    fs.writeFileSync(resolvedSVGPath, svgInline)

    // Mirror into dist/ so the assets ship in the same run's S3 deploy.
    // Nuxt's static-copy step (static/ -> dist/) runs before this hook,
    // so anything written to static/ alone misses the current deploy and
    // only appears in the next run. Mirroring to dist/ closes that gap.
    const distThumbnailPath = path.resolve('dist/thumbnails', route.file)
    const distWebPPath = distThumbnailPath.replace('.png', '.webp')
    const distSVGPath = path.resolve(
      'dist/svg',
      route.file.slice(0, -4) + '.svg'
    )
    fs.mkdirSync(path.dirname(distThumbnailPath), { recursive: true })
    fs.mkdirSync(path.dirname(distSVGPath), { recursive: true })
    fs.copyFileSync(resolvedThumbnailPath, distThumbnailPath)
    fs.copyFileSync(resolvedWebPPath, distWebPPath)
    fs.copyFileSync(resolvedSVGPath, distSVGPath)

    console.error(
      '[publio-diag] generateThumbnails wrote',
      'png=' + resolvedThumbnailPath,
      'webp=' + resolvedWebPPath,
      'svg=' + resolvedSVGPath,
      'pngSize=' + fs.statSync(resolvedThumbnailPath).size,
      'svgSize=' + fs.statSync(resolvedSVGPath).size
    )
    return [route, url, meta]
  } catch (error) {
    console.error(
      '[publio-diag] generateThumbnails FAILED',
      'route=' + route.route,
      'file=' + route.file,
      'error=' + (error && error.message)
    )
    return [route, url, meta]
  } finally {
    if (browser !== null) {
      await browser.close()
    }
  }
}
