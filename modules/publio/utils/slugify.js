// taken from https://gist.github.com/codeguy/6684588
import diacriticsMap from './diacriticsMap'

export default (str) => {
  str = str.replace(/^\s+|\s+$/g, '').trim() // trim
  str = str.toLowerCase()

  // remove accents, swap ñ for n, etc
  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;'
  const to = 'aaaaeeeeiiiioooouuuunc------'
  for (let i = 0, l = from.length; i < l; i++) {
    str = str
      .replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
      .replace(/[^A-Za-z0-9\s]+/g, function (a) {
        return diacriticsMap[a] || a
      })
  }

  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes

  return str
}
