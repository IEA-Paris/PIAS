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
  async fetch({ store, route }) {
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
