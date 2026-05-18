<template>
  <PageContainer>
    <PageTitle :text="$t('editorial-policy')" />
    <v-row justify="center">
      <v-col cols="12" md="8">
        <nuxt-content v-if="page" :document="page" />
      </v-col>
    </v-row>
  </PageContainer>
</template>
<script>
export default {
  props: {},
  async asyncData({ app, $content, store }) {
    const page = await $content(
      'pages/' + app.i18n.locale + '/editorial_policy'
    ).fetch()

    store.commit('setLoading', false)

    return {
      page,
    }
  },
  data() {
    return {
      page: null,
    }
  },
  async fetch() {
    this.page = await this.$content(
      'pages/' + this.$i18n.locale + '/editorial_policy'
    ).fetch()

    this.$store.commit('setLoading', false)
  },
  computed: {},
  watch: {
    '$i18n.locale': '$fetch',
  },
  mounted() {
    this.$store.commit('setLoading', false)
  },
  methods: {},
}
</script>
<style lang="scss"></style>
