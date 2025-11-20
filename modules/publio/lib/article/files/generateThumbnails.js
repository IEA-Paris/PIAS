import { Blob } from 'node:buffer'
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const sharp = require('sharp')
let browser, response
export default async (route, url, meta) => {
  try {
    console.log(
      'starting to generate Thumbnails at ',
      url.replace(/\/$/, '') + route.route
    )
    browser = await puppeteer.launch({
      headless: 'new',
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

    // in case the target folder does not exist, create it

    // create thumbnails
    if (
      !fs.existsSync(
        process.env.NODE_ENV === 'production' && process.env.LOCAL === 'true'
          ? 'static/thumbnails'
          : 'thumbnails'
      )
    ) {
      fs.mkdirSync(
        process.env.NODE_ENV === 'production' && process.env.LOCAL === 'true'
          ? 'static/thumbnails'
          : 'thumbnails'
      )
    }
    const resolvedThumbnailPath = path.resolve(
      process.env.NODE_ENV !== 'production' ||
        (process.env.NODE_ENV === 'production' && process.env.LOCAL === 'true')
        ? 'static/thumbnails'
        : 'thumbnails',
      route.file
    )

    if (
      !fs.existsSync(
        process.env.NODE_ENV === 'production' && process.env.LOCAL === 'true'
          ? 'static/svg'
          : 'svg'
      )
    ) {
      fs.mkdirSync(
        process.env.NODE_ENV === 'production' && process.env.LOCAL === 'true'
          ? 'static/svg'
          : 'svg'
      )
    }

    const resolvedSVGPath = path.resolve(
      process.env.NODE_ENV !== 'production' ||
        (process.env.NODE_ENV === 'production' && process.env.LOCAL === 'true')
        ? 'static/svg'
        : 'svg',
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

    console.log(`Compressed PNG saved for ${route.file}`)

    // Generate WebP version for better performance (60-80% smaller than PNG)
    const resolvedWebPPath = resolvedThumbnailPath.replace('.png', '.webp')
    await sharp(imageBuffer)
      .webp({
        quality: 85,
        effort: 6, // Higher effort = better compression (0-6 scale)
      })
      .toFile(resolvedWebPPath)

    console.log(`WebP version saved for ${route.file.replace('.png', '.webp')}`)

    const svgInline = await page.evaluate(
      () => document.querySelector('svg').outerHTML
    )
    fs.writeFileSync(resolvedSVGPath, svgInline, (err) => {
      if (err) {
        console.error(err)
        return
      }
      console.log(`Write SVG finised for ${route.file}`)
    })
    return [route, url, meta]
  } catch (error) {
    console.log('error: ', error)
    return [route, url, meta]
  }
}
