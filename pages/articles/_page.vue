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
