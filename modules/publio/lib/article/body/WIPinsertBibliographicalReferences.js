import referenceRegex from '../../../utils/referenceRegex'
import classicReferenceRegex from '../../../utils/classicReferenceRegex'

const insertBibliographicalReferences = (node, biblio) => {
  try {
    const replaceRegularReference = (node, match) => {
      console.log('match: ', match)
      let isOpening = false
      let isClosing = false
      if (match?.startsWith('(')) {
        match = match.slice(1)
        isOpening = true
      }
      if (match?.endsWith(')')) {
        match = match.slice(0, -1)
        isClosing = true
      }
      const authors = match.split(',')[0]?.trim()
      console.log('authors: ', authors)
      const years = match.split(',')[1]?.trim()
      console.log('years: ', years)
      const bibMatch = biblio.find((item) => {
        return (
          item.id.toLowerCase().includes(authors.toLowerCase()) &&
          item.id.includes(years)
        )
      })
      if (bibMatch) {
        console.log('bibMatch: ', bibMatch.id)
        node.value = node.value.replace(
          match,
          (isOpening ? '(' : '') + '@' + bibMatch.id + (isClosing ? ')' : '')
        )
        console.log('node.value: ', node.value)
      }

      return node
    }
    const replaceReference = (node) => {
      // start by matching regular references and replacing them by the related bib key
      /*  const regularMatches = node.value.match(classicReferenceRegex)
      if (regularMatches !== null && regularMatches.length > 0) {
        let citations = []
        regularMatches
          .filter(
            (match) =>
              match?.length && !match.startsWith('@') && !match.startsWith('(@')
          )
          .forEach((match) => {
            if (match?.includes(';')) {
              citations.push(match.split(';'))
            } else {
              citations.push(match)
            }
          })
        citations = Array.from(new Set(citations))
        citations.flat().forEach((citation) => {
          node = replaceRegularReference(node, citation)
        })
 */
      // only match citation keys (@author_title_year)
      // 'author' 'title' above refer to the first word of these only

      const matches = [
        ...node.value.match(referenceRegex),
        ...node.value.match(classicReferenceRegex),
      ]
      // do we have references to replace?
      if (matches !== null) {
        const element = matches[0]
        const authors = element.split(',')[0]?.trim()
        console.log('authors: ', authors)
        const years = element.split(',')[1]?.trim()
        console.log('years: ', years)

        // find the related reference
        const ref = biblio.find(
          (item) =>
            item.id === element.toLowerCase().substring(1) ||
            (item.id.toLowerCase().includes(authors.toLowerCase()) &&
              item.id.includes(years))
        )
        if (!ref) {
          // TODO write it in a file somewhere to use it in CMS
          console.log('REFERENCE NOT FOUND IN BIB FILE: ', element)
        } else {
          ref.link = true
          // edit the node to include the link
          node = {
            type: 'element',
            tag: 'span',
            props: { class: 'node' },
            children: [
              { type: 'text', value: node.value.split(element)[0] },
              {
                type: 'element',
                tag: 'a',
                props: {
                  id: 'bb-' + ref.id,
                  href: '#!bb-' + ref.id, // Add ! to avoid scrolling
                },
                children: [
                  {
                    type: 'text',
                    value: ref.citation,
                  },
                ],
              },
              node.value.split(element).slice(1).join(element) &&
                replaceReference({
                  type: 'text',
                  value: node.value.split(element).slice(1).join(element),
                }),
            ],
          }
        }
      }
      return node
    }
    if (node.type === 'text') {
      node = replaceReference(node)
    } else if (node?.children?.length > 0) {
      node.children = node.children.map((child) =>
        insertBibliographicalReferences(child, biblio)
      )
    }
    return node
  } catch (error) {
    console.log('error: ', error)
  }
}

export default insertBibliographicalReferences
