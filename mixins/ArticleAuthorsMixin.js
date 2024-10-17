import { formatAuthors, highlight } from '~/assets/utils/transforms'
import slugify from '~/assets/utils/slugify'

export default {
  props: {
    haveInstitutionsLink: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
  computed: {
    institutions() {
      // get a list of unique institutions
      let institutions = [
        ...new Set(
          this.authors.map((author) =>
            author.positions_and_institutions.map((positionAndInstitution) =>
              positionAndInstitution.institution.trim()
            )
          )
        ),
      ].flat()
      // Prune the case differences
      institutions = [
        ...institutions
          .map((s) => s.toLowerCase())
          .reduce(
            (map, s, i) => (map.get(s) ? map : map.set(s, institutions[i])),
            new Map()
          )
          .values(),
      ]
      return institutions
    },
    authorInformations() {
      // Generate the authors informations and format them
      // Will return an object of array with institutions and authors formated with exponent
      //
      // Example:
      // {
      //   "institutions": ['institution1', 'institution2'],
      //   "authors": ['<a href="...">author1 <sup>0</sup><sup>1</sup>.</a>', '<a href="...">author2<sup>1</sup></a>']
      // }

      const authors = []
      let institutions = []
      /*       this.authors.forEach((author) => {
        if (author?.positions_and_institutions?.length) {
        }
      }) */

      this.authors.forEach((author) => {
        const authorsIndexInstutions = []

        if ('positions_and_institutions' in author) {
          author.positions_and_institutions.forEach(
            (positionAndInstitution) => {
              // get all institutions

              const highlightedInstitution = this.getFormatedInstitution(
                positionAndInstitution
              )
              // get the index of the institution if it already exists
              let indexInstitution = institutions.findIndex(
                (institution) =>
                  institution.toLowerCase() ===
                  highlightedInstitution.toLowerCase()
              )
              // if not, add it to the institutions array
              if (indexInstitution === -1) {
                institutions.push(highlightedInstitution)
                indexInstitution = institutions.length
              } else {
                indexInstitution++
              }
              // add the index of the institution to the author
              authorsIndexInstutions.push(indexInstitution)
            }
          )
        }

        // format the author with the institutions with exponential index of the institution
        authors.push(this.getFormatedAuthors(author, authorsIndexInstutions))
      })

      // Format the institutions with exponential index
      institutions = institutions.map(
        (institution, index) =>
          `<sup class="institution-number">${
            index + 1
          }</sup><span class="institution-name">${institution}</span>`
      )
      return { institutions, authors }
    },
  },
  methods: {
    getFormatedAuthors(author, institutionsIds) {
      return formatAuthors(
        [author],
        this.$i18n.$t,
        true,
        false,
        this.$config.url,
        institutionsIds,
        this.haveInstitutionsLink
      )
    },
    getFormatedInstitution(positionsAndInstitutions) {
      return (
        (positionsAndInstitutions &&
          positionsAndInstitutions &&
          positionsAndInstitutions?.institution) ||
        ''
      )
    },
    slugify(str) {
      return slugify(str)
    },
  },
}
