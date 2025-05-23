import stopWords from './stopWords'

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
  authors = [],
  $t,
  full = false,
  initials = true
) => {
  const format = (author) => {
    const name = author.lastname.trim().replace(' ', '&nbsp;')
    const institution =
      author.positions_and_institutions?.[0]?.institution || ''

    if (author.is_institution) return name

    const firstname =
      author.firstname
        ?.trim()
        ?.replace(/[^A-Za-z0-9À-ÿ ]/gi, '')
        ?.replace(/ +/gi, ' ') || ''

    const initialsText =
      firstname
        .split(/ /)
        ?.reduce((acc, item) => acc + item?.[0], '')
        ?.toUpperCase() || ''
    const firstnameText = !initials
      ? firstname
      : initialsText
          .concat(firstname.substr(1))
          .concat(firstname)
          .substr(0, 1)
          .toUpperCase()

    const authorName = `${name}${
      initials && firstname.length ? '.&nbsp;' : ',&nbsp;'
    }${firstnameText}${initials && firstname.length ? '.&nbsp;' : ''}`

    return full && institution.length
      ? `${authorName} - <i>${institution}</i>`
      : authorName
  }

  if (!authors.length) return ''

  if (authors.length === 1) {
    return format(authors[0])
  }

  if (authors.length === 2) {
    return `${format(authors[0])}${!($t && $t('and')) ? ' and ' : $t('and')}${
      ' ' + format(authors[1])
    }`
  }

  if (authors.length === 3 || full) {
    return authors.map((author) => format(author)).join(', ')
  }

  if (authors.length > 3) {
    return authors
      .slice(0, 4)
      .map((author, index) => (index === 3 ? 'et&nbsp;al.' : format(author)))
      .join(', ')
  }

  return ''
}

export const formatTitleAndInstitutions = (obj) => {
  if (!obj || !obj.length) return '' // The same as before
  return obj
    .map(({ institution, positions }) => {
      // object destructuring of institution and positions property
      if (!institution) return '' // if there is no institution, return an empty string
      return `${institution}${
        positions && positions.length ? ' - ' + positions.join(', ') : ''
      }` // using string interpolation to concatenate institution and positions with a hyphen only if positions exist
    })
    .join(', ') // The same as before
}
export const formatSearch = (str) => {
  if (!str) return []
  else {
    return str
      .split(' ')
      .filter((item) => item.length > 1 && !stopWords.includes(item))
  }
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
    if (query?.[0]?.length) {
      if (word.length > stop) {
        // calculate matches indexes
        const indexes = []
        query.forEach((element, index) => {
          if (word.includes(element)) indexes.push(word.indexOf(element))
        })

        // is there a match?
        if (indexes.length) {
          const firstIndex = Math.min(...indexes)

          // is it in the first 400 chars?
          if (
            firstIndex -
              query.reduce(function (a, b) {
                return a.length > b.length ? a : b
              }).length >
            stop
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

    word = word + (url ? '... <a href="' + url + '">' + link + '</a>' : '...')
    return word
  } catch (error) {}
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
  // TODO replace hard coded colors/lengths by config variables
  const stopwords = ['this']

  const tokens = query.split(/\W+/).filter(function (token) {
    token = token.toLowerCase()
    return token.length >= 2 && !stopwords.includes(token)
  })
  tokens.forEach((token) => {
    const regex = new RegExp(token, 'gi')
    word = word.replaceAll(
      regex,
      '<strong style="color:' +
        (light ? 'black' : 'white') +
        ';background-color:' +
        (light ? 'white' : 'black') +
        ';">$&</strong>'
    )
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
  // Split parameters or split folder separator
  if (str.includes('?')) {
    return str.split('?')[0]
  }
  if (str.includes('/')) {
    return str.split('/')[0]
  }
  if (str.includes('&')) {
    return str.split('&')[0]
  }
  return str
}
