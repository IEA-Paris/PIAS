<template>
  <v-container
    class="transition-swing"
    :fluid="!$store.state.scrolled"
    :class="{ 'py-0': !$store.state.scrolled }"
  >
    <v-row v-scroll="onScroll" class="transition-swing">
      <v-col class="transition-swing" cols="12">
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <div
              class="main-title"
              :class="$store.state.scrolled ? 'mb-16 mt-8' : 'mb-8 mt-2'"
            >
              Proceedings of the institutes for Advanced Study
            </div>
            <nuxt-content :document="page" />
          </v-col>
        </v-row> </v-col
    ></v-row>
  </v-container>
</template>
<script>
export default {
  props: {},
  async asyncData({ $content, store }) {
    const page = await $content('pages/about').fetch()

    store.commit('setLoading', false) /* commit('setItems', {
      items: latestIssueArticles,
      total: latestIssueArticles.length,
      numberOfPages: 1,
      type: 'articles', 
    }) */
    return {
      page,
    }
  },
  data() {
    return {}
  },
  computed: {},
  mounted() {},
  methods: {
    onScroll() {
      this.$store.commit('setScrolled')
    },
  },
}
</script>
<style lang="scss">
@import '~vuetify/src/styles/settings/_variables';
.main-title {
  font-family: 'Bodoni Moda';
  font-size: 3rem !important;
  font-weight: 500 !important;
  line-height: 3.5rem;
  max-width: 100%;
}
@media #{map-get($display-breakpoints, 'sm-only')} {
  .main-title {
    font-size: 2.4rem !important;
    line-height: 3rem;
  }
}
@media #{map-get($display-breakpoints, 'xs-only')} {
  .main-title {
    font-size: 2rem !important;
    line-height: 2.5rem;
  }
}
</style>
