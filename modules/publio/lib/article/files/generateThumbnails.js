import { Blob } from 'node:buffer'
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
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
    await page.setViewport(
      // Pixel equivalent of an A4 page with 300dpi
      { width: 2480, height: 3508, deviceScaleFactor: 1 }
    )
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

    fs.writeFileSync(resolvedThumbnailPath, imageBuffer)

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
