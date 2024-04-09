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
    console.log('imageBuffer: ', imageBuffer)
    const resolvedThumbnailPath = path.resolve(
      process.env.NODE_ENV !== 'production' ||
        (process.env.NODE_ENV === 'production' && process.env.LOCAL === 'true')
        ? 'static/thumbnails'
        : 'thumbnails',
      route.file
    )
    fs.writeFileSync(resolvedThumbnailPath, imageBuffer)

    const resolvedSVGPath = path.resolve(
      process.env.NODE_ENV !== 'production' ||
        (process.env.NODE_ENV === 'production' && process.env.LOCAL === 'true')
        ? 'static/svg'
        : 'svg',
      route.file.slice(0, -4) + '.svg'
    )
    const svgInline = await page.evaluate(
      () => document.querySelector('svg').outerHTML
    )
    console.log('svgInline: ', svgInline)
    fs.writeFile(resolvedSVGPath, svgInline, (err) => {
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
