<template>
  <div>
    <PageTitle :text="$t('media')" />
    <ListLeftPanel
      type="media"
      tiles
      :layout="{ cols: 12, md: 6, nogutters: false, fluid: true }"
      :pagination="{
        itemsPerPage: 9,
        page: $route.params.page || 1,
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
    return {}
  },
  head() {
    const page = this.$route.params.page || 1
    const title = page > 1 ? `Media - Page ${page}` : 'Media'
    const description = `Browse all media content including videos, podcasts, and presentations from ${this.$config.full_name}. Open access multimedia research content.`
    const url = `${this.$config.url}/media${page > 1 ? '/' + page : ''}`

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
    store.commit('loadRouteQueryAndParams', 'media')

    // Initialize the store with data during server-side rendering
    await store.dispatch('update', 'media')
  },
  computed: {},
  mounted() {},
  methods: {},
}
</script>
<style lang="scss"></style>
