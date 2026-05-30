import formattingFixes from './formattingFixes'

// Frontmatter / article keys that hold structural identifiers or the parsed
// content tree rather than human-readable prose. Running character fixes on
// these could change a slug, path or route (or corrupt the body AST), so they
// are skipped. The body is handled separately by walking its text nodes.
const SKIP_KEYS = new Set([
  'body',
  'dir',
  'path',
  'slug',
  'extension',
  'toc',
  'Toc2',
  'createdAt',
  'updatedAt',
])

// Recursively apply formattingFixes to every string found in a frontmatter
// value, descending into nested objects and arrays (e.g. authors[].lastname,
// authors[].social_channels.website). Non-string leaves are returned untouched.
const fixValue = (value) => {
  if (typeof value === 'string') return formattingFixes(value)
  if (Array.isArray(value)) return value.map(fixValue)
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (SKIP_KEYS.has(key)) continue
      value[key] = fixValue(value[key])
    }
    return value
  }
  return value
}

// Walk the parsed markdown AST and apply the fixes to every text node's value.
const fixBodyNodes = (node) => {
  if (!node || typeof node !== 'object') return
  if (typeof node.value === 'string') {
    node.value = formattingFixes(node.value)
  }
  if (Array.isArray(node.children)) {
    node.children.forEach(fixBodyNodes)
  }
}

// Normalise problematic characters across an article: both the body content and
// every string value in its frontmatter. Mutates and returns the article so it
// can slot into the existing processArticle transformer pipeline.
export default (article) => {
  // Frontmatter: every top-level field except the reserved/structural ones.
  for (const key of Object.keys(article)) {
    if (SKIP_KEYS.has(key)) continue
    article[key] = fixValue(article[key])
  }

  // Body: the parsed content tree.
  if (article.body) fixBodyNodes(article.body)

  return article
}
