const fs = require('fs')
const Markdown = require('@nuxt/content/parsers/markdown')
const plugins = ['remark-squeeze-paragraphs','remark-slug','remark-autolink-headings','remark-external-links','remark-footnotes','remark-gfm']
const rehype = ['rehype-sort-attribute-values','rehype-sort-attributes','rehype-raw']
const load = ns => ns.map(name => ({ instance: (require(name).default||require(name)), options:{} }))
const md = new Markdown({ remarkPlugins: load(plugins), rehypePlugins: load(rehype), tocTags:['h2','h3'] })
const content = fs.readFileSync(process.argv[2],'utf8')
md.toJSON(content).then(j => {
  fs.writeFileSync('/tmp/body.json', JSON.stringify(j.body, null, 1))
  // walk for any element missing props OR with non-object props
  let n=0
  ;(function w(node){
    if(node&&typeof node==='object'){
      if(node.type&&node.type!=='text'&&node.type!=='root'){
        n++
        if(typeof node.props!=='object'||node.props===null) console.log('SUSPECT', node.tag, typeof node.props)
      }
      ;(node.children||[]).forEach(w);(node.content||[]).forEach(w)
    }
  })(j.body)
  console.log('elements:',n)
}).catch(e=>console.error('ERR',e))
