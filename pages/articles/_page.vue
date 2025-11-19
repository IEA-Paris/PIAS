<template>
  <div>
    <PageTitle :text="$t('articles')" />
    <ListLeftPanel
      :type="type"
      tiles
      :layout="{ cols: 12, md: 6, nogutters: false, fluid: true }"
      :pagination="{
        itemsPerPage: 9,
        page: $route.params.page,
        sortBy: [],
        sortDesc: [true],
        itemsPerPageArray: [9, 16, 30],
      }"
    ></ListLeftPanel>
  </div>
</template>
<script>
export default {
  data() {
    return {
      type: 'articles',
    }
  },
  head() {
    const page = this.$route.params.page || 1
    const title = page > 1 ? `Articles - Page ${page}` : 'Articles'
    const description = `Browse all articles published in ${this.$config.full_name}. Open access research articles from the Paris Institute for Advanced Study.`
    const url = `${this.$config.url}/articles${page > 1 ? '/' + page : ''}`

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
        {
          hid: 'og:type',
          property: 'og:type',
          content: 'website',
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `${title} - ${this.$config.full_name}`,
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: description,
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
    store.commit('loadRouteQueryAndParams', 'articles')

    // Initialize the store with data during server-side rendering
    await store.dispatch('update', 'articles')
  },
  computed: {},
  mounted() {},
  created() {},
  methods: {},
}
</script>
<style lang="scss"></style>
