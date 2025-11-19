<template>
  <div>
    <PageTitle :text="$t('authors')" />
    <ListLeftPanel
      type="authors"
      :layout="{ cols: 12, md: 6, nogutters: false, fluid: true }"
      :pagination="{
        itemsPerPage: 30,
        page: $route.params.page || 1,
        sortBy: [],
        sortDesc: [true],
        itemsPerPageArray: [30, 60, 100],
      }"
    ></ListLeftPanel>
  </div>
</template>
<script>
export default {
  data() {
    return {}
  },
  head() {
    const page = this.$route.params.page || 1
    const title = page > 1 ? `Authors - Page ${page}` : 'Authors'
    const description = `Explore all authors and contributors to ${this.$config.full_name}. Browse researcher profiles, affiliations, and publications.`
    const url = `${this.$config.url}/authors${page > 1 ? '/' + page : ''}`

    return {
      title,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: description,
        },
        {
          hid: 'og:title',
          property: 'og:title',
          content: `${title} - ${this.$config.full_name}`,
        },
        {
          hid: 'og:description',
          property: 'og:description',
          content: description,
        },
        {
          hid: 'og:url',
          property: 'og:url',
          content: url,
        },
      ],
      link: [
        {
          hid: 'canonical',
          rel: 'canonical',
          href: url,
        },
      ],
    }
  },
  async fetch({ store, route }) {
    // Skip fetch on client-side navigation - ListLeftPanel will load database when needed
    if (process.client) return

    // Load route query and params into store
    store.commit('loadRouteQueryAndParams', 'authors')

    // Initialize the store with data during server-side rendering
    await store.dispatch('update', 'authors')
  },
  computed: {},
  mounted() {},
  methods: {},
}
</script>
<style lang="scss"></style>
