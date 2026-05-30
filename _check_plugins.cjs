const names = ['remark-squeeze-paragraphs','remark-slug','remark-autolink-headings','remark-external-links','remark-footnotes','remark-gfm','rehype-sort-attribute-values','rehype-sort-attributes','rehype-raw']
for (const n of names) {
  try { const m = require(n); console.log(n, '->', typeof (m.default||m)) }
  catch(e){ console.log(n, 'LOAD FAIL', e.message) }
}
