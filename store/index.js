import { set } from 'vue'
import filtersRaw from '~/assets/data/filters'
import lists from '~/assets/data/lists'
import config from '~/config'

export const state = () => ({
  scrolled: process.browser ? window.pageYOffset > 0 : false,
  logo: 0,
  loading: true,
  resetFilters: false,
})

export const mutations = {
  setLogo(state, value) {
    set(state, 'logo', value)
    state.logo = value
  },
  setLoading(state, value) {
    set(state, 'loading', value)
  },
  setScrolled(state) {
    if (process.browser) {
      set(state, 'scrolled', window.pageYOffset > 0)
    }
  },

  loadRouteQueryAndParams(state, type, rootState) {
    const query = this.app.router.currentRoute.query
    const params = this.app.router.currentRoute.params
    if (query.search) {
      set(state[type], 'search', query.search)
    }
    if (query.filters) {
      const filters = JSON.parse(query.filters)
      Object.keys(filters).forEach((filter) => {
        set(state[type].filters, filter, filters[filter])
      })
    }

    if (query.view) set(state[type], 'view', query.view)
    if (params.page) {
      set(state[type], 'page', params.page)
    } else {
      set(state[type], 'page', 1)
    }

    const defaultSort = [
      lists[type].sort[
        Object.keys(lists[type].sort).find(
          (item) => lists[type].sort[item].default === true
        )
      ],
    ]
    if (query.sortBy) set(state[type], 'sortBy', [query.sortBy])

    if (typeof query.sortDesc !== 'undefined') {
      set(state[type], 'sortDesc', !!(query.sortDesc === 'true'))
    } else {
      set(state[type], 'sortDesc', !!(defaultSort[0].value[1] === 'desc'))
    }
  },
  setSearch(state, { search, type }) {
    set(state[type], 'search', search)
  },
  setItems(state, { type, ...values }) {
    set(state[type], 'items', values.items)
    set(state[type], 'total', values.total)
    set(state[type], 'numberOfPages', values.numberOfPages)
  },
  setItemsPerPage(state, { value, type }) {
    state[type].itemsPerPage = value
  },
  setPage(state, { page, type }) {
    if ((this.app.router.currentRoute.params.page || 1) !== page) {
      this.app.router.push('/' + type + '/' + page)
    }
    set(state[type], 'page', page)
  },
  setFilters(state, { filters, type }) {
    if (filters[Object.keys(filters)[0]].length) {
      state[type].loading.push(Object.keys(filters)[0])
    }
    set(
      state[type].filters,
      Object.keys(filters)[0],
      filters[Object.keys(filters)[0]]
    )
  },
  setSort(state, { value, type }) {
    set(state[type], 'sortBy', [value[0]])
    set(state[type], 'sortDesc', value[1] === 'desc')
  },
  setView(state, { value, type }) {
    set(state[type], 'view', value)
  },
  setFiltersCount(state, type) {
    const filters = state[type].filters
    const filtersCount = Object.keys(filters)
      // remove empty values
      .filter(
        (filter) =>
          (typeof filters[filter] === 'boolean' &&
            filters[filter] !== null &&
            filters[filter] !== undefined) ||
          (Array.isArray(filters[filter]) && filters[filter].length) ||
          (typeof filters[filter] === 'object' &&
            Object.keys(filters[filter]).length)
      ).length
    set(state[type], 'filtersCount', filtersCount)
  },
  setBlankState(state, type) {
    set(state, 'resetFilters', true)

    const defaultView =
      lists[type].views[
        Object.keys(lists[type].views).find(
          (item) => lists[type].views[item].default === true
        )
      ]
    const defaultSort = [
      lists[type].sort[
        Object.keys(lists[type].sort).find(
          (item) => lists[type].sort[item].default === true
        )
      ],
    ]
    // TODO make dynamic based on an ~/assets located file
    set(state[type], 'filters', {
      years: [],
      issue: [],
      tags: [],
      language: [],
      thematic: [],
      discipline: [],
      type: [],
    })

    set(state[type], 'search', '')
    set(state[type], 'view', defaultView.name)
    set(state[type], 'sortBy', [defaultSort[0].value[0]])
    set(state[type], 'sortDesc', defaultSort[0].value[1] === 'desc')
    set(state, 'resetFilters', false)
  },
  setBlankFilterLoad(state, type) {
    set(state[type], 'loading', [])
  },
  setStyle(state, style) {
    set(state.articles, 'style', style)
  },
}

// ACTIONS
export const actions = {
  async nuxtServerInit({ dispatch }) {
    await dispatch('update', 'articles')
    await dispatch('update', 'media')
    await dispatch('update', 'authors')
  },
  async resetState({ dispatch, commit, state }, type) {
    commit('setBlankState', type)
    commit('setPage', { page: 1, type })
    await dispatch('update', type)
  },
  async updateSort({ dispatch, commit, state }, { value, type }) {
    commit('setSort', { value, type })
    commit('setPage', { page: 1, type })
    await dispatch('update', type)
  },
  async updateView({ dispatch, commit, state }, { value, type }) {
    commit('setView', { value, type })
    await dispatch('update', type)
  },
  async updateFilters({ dispatch, commit, state }, { filters, type }) {
    commit('setFilters', { filters, type })
    commit('setPage', { page: 1, type })
    await dispatch('update', type)
  },
  async updateItemsPerPage({ dispatch, commit, state }, { value, type }) {
    commit('setPage', { page: 1, type })
    commit('setItemsPerPage', { value, type })
    await dispatch('update', type)
  },
  async updatePage({ dispatch, commit, state }, { page, type }) {
    commit('setPage', { page, type })
    await dispatch('update', type)
  },
  async updateSearch({ dispatch, commit, state }, { search, type }) {
    commit('setPage', { page: 1, type })
    commit('setSearch', { search, type })
    await dispatch('update', type)
  },
  async update({ dispatch, commit, state, getters, rootState }, type) {
    commit('setLoading', true)
    // TODO re-enable when it works as intended once deployed
    /*     if (
      process.client &&
      Object.keys(window.$nuxt.$root.$loading).length &&
      process.env.NODE_ENV === 'production'
    ) {
      window.$nuxt.$root.$loading.start()
    } */
    const pipeline = {
      // default filters
      ...filtersRaw[type],
    }
    const queryFilters = {}
    pipeline.$and = []
    const filters = rootState[type].filters

    Object.keys(filters).forEach((filter) => {
      // remove empty values
      if (
        !(
          (typeof filters[filter] === 'boolean' &&
            filters[filter] !== null &&
            filters[filter] !== undefined) ||
          (Array.isArray(filters[filter]) && filters[filter].length) ||
          (typeof filters[filter] === 'object' &&
            Object.keys(filters[filter]).length)
        )
      ) {
        delete filters[filter]
        return
      }
      // update route query
      queryFilters[filter] = filters[filter]
      const val = filters[filter]
      // convert filters into mongo-like loki query & push in the pipeline
      if (
        filters[filter] ||
        (Array.isArray(filters[filter]) && filters[filter].length)
      ) {
        // check if we are matching against an array value
        if (['tag', 'thematic', 'discipline', 'type'].includes(filter)) {
          pipeline[filter] = { $containsAny: val }
          // years to date special case
          // TODO make a fancy feature to limit the gte lt
        } else if (['language'].includes(filter)) {
          pipeline.language = { $containsAny: val }
        } else if (filter === 'issue') {
          pipeline.issue = {
            $containsAny: val.map((item) => 'content/issues/' + item + '.md'),
          }
        } else if (filter === 'years') {
          const yearsToInt = val.map((i) => +i)
          if (['articles', 'media'].includes(type)) {
            pipeline[filter] = { $in: yearsToInt }
          } else {
            pipeline[filter] = { $containsAny: yearsToInt }
          }
        } else {
          pipeline[filter] = Array.isArray(val) ? val[0] : val
        }
      }
    })
    if (!pipeline.$and.length) {
      delete pipeline.$and
    } else {
      pipeline.$and = pipeline.$and.flat()
    }

    const count = await this.$content(type, { deep: true })
      .search(rootState[type].search)
      .where(pipeline)
      .only('[]')
      .fetch()

    const totalItems = count.length

    // use Math.ceil to round up to the nearest whole number
    const lastPage = Math.ceil(totalItems / rootState[type].itemsPerPage)

    // use the % (modulus) operator to get a whole remainder
    const lastPageCount = totalItems % rootState[type].itemsPerPage
    const skipNumber = () => {
      if (+rootState[type].page === 1) {
        return 0
      }
      if (+rootState[type].page === lastPage) {
        if (lastPageCount === 0) {
          return totalItems - rootState[type].itemsPerPage
        }

        return totalItems - lastPageCount
      }
      return (+rootState[type].page - 1) * rootState[type].itemsPerPage
    }

    const sortArray =
      rootState[type].view === 'issues'
        ? [
            'issueIndex',
            rootState[type].sortDesc ? 'desc' : 'asc',
            'date',
            rootState[type].sortDesc ? 'desc' : 'asc',
          ]
        : [rootState[type].sortBy[0], rootState[type].sortDesc ? 'desc' : 'asc']

    const items = await this.$content(type, { deep: true })
      .where(pipeline)
      .search(rootState[type].search)
      .sortBy(sortArray[0], sortArray[1])
      .sortBy(sortArray[2], sortArray[3])
      .skip(skipNumber())
      .limit(rootState[type].itemsPerPage)
      .only(lists[type].listKeys)
      .fetch()
    const defaultView =
      lists[type].views[
        Object.keys(lists[type].views).find(
          (item) => lists[type].views[item].default === true
        )
      ]
    const defaultSort =
      lists[type].sort[
        Object.keys(lists[type].sort).find(
          (item) => lists[type].sort[item].default === true
        )
      ]

    // update route
    const query = {
      ...(rootState[type].search &&
        typeof rootState[type].search !== 'undefined' && {
          search: rootState[type].search,
        }),
      ...(rootState[type].sortBy?.length &&
        rootState[type].sortBy[0] !== defaultSort.value[0] && {
          sortBy: rootState[type].sortBy[0],
        }),
      ...(typeof rootState[type].sortDesc !== 'undefined' &&
        (rootState[type].sortDesc ? 'desc' : 'asc') !==
          defaultSort.value[1] && {
          sortDesc: !!rootState[type].sortDesc,
        }),
      ...(rootState[type].view &&
        rootState[type].view !== defaultView.name && {
          view: rootState[type].view,
        }),
      ...(Object.keys(filters)?.length && {
        filters: JSON.stringify(queryFilters),
      }),
    }
    const sortObject = (obj) => Object.fromEntries(Object.entries(obj).sort())

    Object.keys(query).forEach((key) =>
      query[key] === undefined
        ? delete query[key]
        : // convert boolean to string
        typeof query[key] === 'boolean'
        ? query[key] === query[key].toString()
        : {}
    )

    if (
      JSON.stringify(this.$router.currentRoute.query) !==
      JSON.stringify(sortObject(query))
    ) {
      // TODO fix these damn false positives (lead: see if pre-resolving the route before replacing it is possible/relevant or come up with another way to compare query & store)
      this.$router.replace({
        query,
      })
    }

    // fetch the item categories
    /*     if (['articles', 'media'].includes(type)) {
      items = await Promise.all(
        await items.map((item) => {
          if (item.issue && item.issue.length) {
            /*           item.issue = await this.$content(
              item.issue.split('/').slice(1).join('/').split('.')[0] // TODO fix (cmon)
            )
              .only(['title', 'color'])
              .fetch() 
          }
          return item
        })
      )
    } */
    /*     const isDesc = rootState[type].sortDesc[0] || defaultSort.value[1]
    const sorter = rootState[type].sortBy[0] || defaultSort.value[0]
    
    items = items.sort(
      (a, b) =>
        (isDesc ? a[sorter] : b[sorter]) - (isDesc ? b[sorter] : a[sorter])
    ) */
    commit('setFiltersCount', type)
    commit('setBlankFilterLoad', type)
    commit('setItems', {
      items,
      total: totalItems,
      numberOfPages: lastPage,
      type,
    })
    commit('setLoading', false)

    if (
      process.client &&
      window.$nuxt.$root.$loading &&
      process.env.NODE_ENV === 'production'
    ) {
      // TODO wheck and find out why the object below is not available in some cases when deployed
      /*  window.$nuxt.$root.$loading.stop() */
    }
    /* HIGHLIGHT MECHANISM (disabled until reassessment of its usefulness & relevance
    //TODO deal with that ) 
    // on mobile or list view, highlight slots are the first ones
    if (
      window.$nuxt.$root.$vuetify.breakpoint.mobile ||
      ['list', 'text'].includes(rootState[type].view)
    ) {
      items = items.sort((a, b) => b.highlight - a.highlight)
      
      commit('setFiltersCount')
      commit('setItems', {
        items,
        total: totalItems,
        numberOfPages: lastPage,
      })
    } else {
      // on md highlight slots are on a 1/5/6 pattern
      const availableSlots = rootState[type].itemsPerPage / 3

      const highlightedItems = items.filter((item) => item.highlight)

      const slotedHighlightedItems = highlightedItems.slice(0, availableSlots)

      const regularItems = [
        ...highlightedItems.slice(availableSlots),
        ...items.filter((item) => !item.highlight),
      ]

      const sortedItems = []
      slotedHighlightedItems.forEach((element, index) => {
        sortedItems.push(element)
        sortedItems.push(...regularItems.splice(index * 2, 2))
      })
      sortedItems.push(...regularItems)
      commit('setFiltersCount')
      commit('setItems', {
        items: sortedItems,
        total: totalItems,
        numberOfPages: lastPage,
      })
    } */
  },
}
export const getters = {}
