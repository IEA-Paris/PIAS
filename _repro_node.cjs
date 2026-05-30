const fs = require('fs')
const Markdown = require('@nuxt/content/parsers/markdown')

const plugins = [
  'remark-squeeze-paragraphs',
  'remark-slug',
  'remark-autolink-headings',
  'remark-external-links',
  'remark-footnotes',
  'remark-gfm'
]
const rehype = ['rehype-sort-attribute-values', 'rehype-sort-attributes', 'rehype-raw']

function load (names) {
  return names.map(name => {
    let instance
    try { instance = require(name) } catch (e) { instance = require(name).default }
    instance = instance.default || instance
    return { instance, options: {} }
  })
}

const md = new Markdown({
  remarkPlugins: load(plugins),
  rehypePlugins: load(rehype),
  tocTags: ['h2', 'h3'],
})

const file = process.argv[2]
const content = fs.readFileSync(file, 'utf8')

function walk (node, path) {
  if (!node || typeof node !== 'object') return
  if (node.type && node.type !== 'text' && node.type !== 'root') {
    if (node.props === undefined || node.props === null) {
      console.log('BAD NODE at', path, JSON.stringify({ type: node.type, tag: node.tag, props: node.props, childCount: (node.children || []).length }))
      console.log('  children preview:', JSON.stringify((node.children || []).slice(0, 3)).slice(0, 300))
    }
  }
  for (const c of (node.children || [])) walk(c, path + '>' + (c.tag || c.type))
  for (const c of (node.content || [])) walk(c, path + '#content>' + (c.tag || c.type))
}

md.toJSON(content).then(json => {
  walk(json.body, 'body')
  console.log('done walking')
}).catch(e => { console.error('PARSE ERROR', e) })
