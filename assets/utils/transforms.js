import stopWords from './stopWords'
import { getAuthorSlug } from './slugify'

export const getKey = (id, key) => {
  let selector
  /*   switch (key) {
    case 'field':
      selector = fields
      break
    case 'type':
      selector = types
      break
    case 'thematic':
      selector = thematics
      break
    case 'continent':
      selector = continents
      break
    case 'country':
      selector = countrySet
      break
    case 'state':
      selector = states
      break
    case 'status':
      selector = status
      break
    default:
      break
  } */
  return selector.find((item) => item.value === id).text
}
export const groupBy = (xs, key) => {
  return xs.reduce(function (rv, x) {
    ;(rv[x[key]] = rv[x[key]] || []).push(x)
    return rv
  }, {})
}
export const formatDate = (timestamp, withTime) => {
  const date = new Date(timestamp * 1000)
  if (isNaN(date)) return 'Invalid date'

  let formatedDate = date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  if (withTime) {
    const minutes = date.getMinutes()
    const minutesStr = `${minutes < 10 ? '0' : ''}${minutes}`
    formatedDate = formatedDate + ' at ' + date.getHours() + ':' + minutesStr
  }

  return formatedDate
}
export const formatAuthors = (
  authors = false,
  $t,
  full = false,
  initials = true,
  url = '',
  institutionsIds = [],
  linkInsitution = true
) => {
  const format = (author) => {
    const name =
      // yup, you gotta love ternaries
      author.lastname.replace(' ', '&nbsp;').trim() +
      (author.is_institution
        ? ''
        : (initials ? '&nbsp;' : ',&nbsp;') +
          (initials
            ? author.firstname
                .trim()
                .replace(/[^A-Za-z0-9À-ÿ ]/gi, '') // taking care of accented characters as well
                .replace(/ +/gi, ' ') // replace multiple spaces to one
                .split(/ /) // break the name into parts
                .reduce((acc, item) => acc + item[0], '') // assemble an abbreviation from the parts
                .concat(author.firstname.substr(1)) // what if the name consist only one part
                .concat(author.firstname) // what if the name is only one character
                .substr(0, 1) // get the first two characters an initials
                .toUpperCase()
            : author.firstname) +
          (initials ? '.&nbsp;' : ''))

    if (full) {
      const slug = getAuthorSlug(author)
      const instutionElmt = institutionsIds
        .map((instutionId, index) => {
          if (linkInsitution) {
            return `<a style="text-decoration: none;" href="#institution-${instutionId}"><sup>${instutionId}&nbsp;</sup></a>`
          }
          return `<sup>${instutionId}</sup>${
            index === institutionsIds.length - 1 ? '' : '&nbsp;'
          }`
        })
        .join('')
      return `<a href="${url}/author/${slug}" style="text-decoration: none; color: inherit;">${name}<span style="margin-left: 3px">${instutionElmt}</span></a>`
    }
    return name
  }
  if (!authors) return ''

  if (authors.length === 1) return format(authors[0])

  if (authors.length === 2) {
    return (
      format(authors[0]) +
      // fallback on english for pdfs (only case where $t is called as undefined)
      // TODO: double check it works once we go for multilingual
      (typeof $t === 'undefined' ? ' and ' : $t('and')) +
      format(authors[1])
    )
  }
  if (authors.length === 3 || full) {
    return authors.map((author) => format(author)).join(', ')
  }
  if (authors.length > 3) {
    return authors
      .slice(0, 4)
      .map((author, index) => {
        if (index === 3) return 'et&nbsp;al.'
        return format(author)
      })
      .join(', ')
  }
}
export const formatTitleAndInstitutions = (obj) => {
  if (!obj || !obj.length) return ''
  return obj
    .map((institution) =>
      institution.institution
        ? institution.institution +
          (institution.positions && institution.positions.length
            ? ' - ' + institution.positions.join(', ')
            : '')
        : ''
    )
    .join(', ')
}
export const formatSearch = (str) => {
  if (!str) return []
  const words = str.split(' ')
  return words.filter((word) => word.length > 1 && !stopWords.includes(word))
}

export const capitalize = (value) => {
  return value.replace(/(?:^|[\s'-])\S/g, (a) => a.toUpperCase())
}

export const dateToText = (date) => {
  if (Array.isArray(date)) return date?.join(' ~ ')
  else return date
}

export const truncate = (text, stop, link, url) => {
  return (
    text.slice(0, stop) +
    (stop < text.length
      ? url
        ? '... <a href="' + url + '">' + link + '</a>'
        : '...'
      : '')
  )
}

export const highlightAndTruncate = (stop, word, query, url, link) => {
  try {
    // check that query exists, has an array and has elements inside
    if (query?.length && query[0]?.length) {
      // check if the word length is greater than the stop value
      if (word.length > stop) {
        // map each query element to its matching index (if it exists)
        const indexes = query
          .map((element) => word.indexOf(element))
          .filter((index) => index !== -1)

        // check if matches have been found
        if (indexes.length) {
          // get the lowest index value
          const firstIndex = Math.min(...indexes)

          // check if the first index is greater than the stop value plus the length of the longest query string
          if (
            firstIndex >
            stop + Math.max(...query.map((element) => element.length))
          ) {
            // check if the first index is at the end of the string, if so, we split from the end
            if (word.length - firstIndex < stop) {
              word = '...' + word.substring(word.length - stop, word.length)
            } else {
              // if not, we shift the string to its start
              word =
                '...' + word.substring(firstIndex - 5, stop - 5 + firstIndex)
            }
          } else {
            word = word.slice(0, stop)
          }
        } else {
          // no match, let's just truncate
          word = word.slice(0, stop)
        }

        // highlight each query string in the word
        query.forEach((element) => {
          const check = new RegExp(element, 'ig')
          word = word.replace(check, function (matchedText, a, b) {
            return (
              '<strong style="color: darkslategray;background-color: yellow;">' +
              matchedText +
              '</strong>'
            )
          })
        })
      }
    }

    word += url ? `... <a href="${url}">${link}</a>` : '...'

    return word
  } catch (error) {
    console.log(error)
    return ''
  }
}

export const formatBiblioAPA7th = (item, name, self = true) => {
  return (
    item.entryTags.author +
    '. ' +
    item.entryTags.year +
    '. ' +
    // eslint-disable-next-line no-useless-escape
    item.entryTags.title.replace(/[\{\}']+/gi, '') +
    ' <i>' +
    (self ? name : item.entryTags.journal) +
    '.' +
    (item.entryTags.doi ? ' DOI: ' + item.entryTags.doi : '') +
    '</i>'
  )
}
export const highlight = (word, query = '', light = false) => {
  const stopwords = ['this']

  const tokens = query.split(/\W+/).filter((token) => {
    token = token.toLowerCase()
    return token.length >= 2 && !stopwords.includes(token)
  })

  tokens.forEach((token) => {
    const regex = new RegExp(token, 'gi')
    const bgColor = light ? 'white' : 'black'
    const fontColor = light ? 'black' : 'white'
    const style = `style="color: ${fontColor}; background-color: ${bgColor}"`

    word = word.replace(regex, `<strong ${style}>$&</strong>`)
  })

  return word
}
/**
 * Get the Youtube Video id.
 * @param {string} youtubeStr - the url from which you want to extract the id
 * @returns {string|undefined}
 */
export const getYoutubeVideoId = (youtubeStr) => {
  let str = youtubeStr

  // remove time hash at the end of the string
  str = str.replace(/#t=.*$/, '')

  // shortcode
  const shortcode = /youtube:\/\/|https?:\/\/youtu\.be\/|http:\/\/y2u\.be\//g

  if (shortcode.test(str)) {
    const shortcodeid = str.split(shortcode)[1]
    return stripParameters(shortcodeid)
  }

  // /v/ or /vi/
  const inlinev = /\/v\/|\/vi\//g

  if (inlinev.test(str)) {
    const inlineid = str.split(inlinev)[1]
    return stripParameters(inlineid)
  }

  // v= or vi=
  const parameterv = /v=|vi=/g

  if (parameterv.test(str)) {
    const arr = str.split(parameterv)
    return stripParameters(arr[1].split('&')[0])
  }

  // v= or vi=
  const parameterwebp = /\/an_webp\//g

  if (parameterwebp.test(str)) {
    const webp = str.split(parameterwebp)[1]
    return stripParameters(webp)
  }

  // embed
  const embedreg = /\/embed\//g

  if (embedreg.test(str)) {
    const embedid = str.split(embedreg)[1]
    return stripParameters(embedid)
  }

  // ignore /user/username pattern
  const usernamereg = /\/user\/([a-zA-Z0-9]*)$/g

  if (usernamereg.test(str)) {
    return undefined
  }

  // user
  const userreg = /\/user\/(?!.*videos)/g

  if (userreg.test(str)) {
    const elements = str.split('/')
    return stripParameters(elements.pop())
  }

  // attribution_link
  const attrreg = /\/attribution_link\?.*v%3D([^%&]*)(%26|&|$)/

  if (attrreg.test(str)) {
    return stripParameters(str.match(attrreg)[1])
  }

  return undefined
}
/**
 * Strip away any parameters following `?` or `/` or '&'
 * @param str
 * @returns {String}
 */
export default function stripParameters(str) {
  const regex = /[/?&]/
  return str.split(regex)[0]
}
