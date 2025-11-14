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
