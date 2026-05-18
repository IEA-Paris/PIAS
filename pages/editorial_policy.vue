<template>
  <PageContainer>
    <PageTitle :text="$t('editorial-policy')" />
    <v-row justify="center">
      <v-col cols="12" md="8">
        <nuxt-content v-if="page" :document="page" />
      </v-col>
    </v-row>

    <v-row
      v-if="editorialCommittee && editorialCommittee.length"
      justify="center"
    >
      <v-col cols="12" md="10" lg="8">
        <h2 class="text-h4 mt-8 mb-4">{{ $t('editorial_committee') }}</h2>
        <v-row>
          <v-col
            v-for="(item, index) in editorialCommittee"
            :key="'committee-' + item.slug"
            cols="12"
          >
            <AuthorsListItem :item="item" :index="index" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-row v-if="editorialFellows && editorialFellows.length" justify="center">
      <v-col cols="12" md="10" lg="8">
        <h2 class="text-h4 mt-8 mb-4">{{ $t('editorial_fellows') }}</h2>
        <v-row>
          <v-col
            v-for="(item, index) in editorialFellows"
            :key="'fellow-' + item.slug"
            cols="12"
          >
            <AuthorsListItem :item="item" :index="index" />
          </v-col>
        </v-row>
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

    const allAuthors = await $content('authors', { deep: true })
      .where({
        $or: [{ editorial_fellow: true }, { editorial_committee: true }],
      })
      .fetch()

    const sortByLastname = (a, b) =>
      (a.lastname || '').localeCompare(b.lastname || '')

    const editorialCommittee = allAuthors
      .filter((a) => a.editorial_committee)
      .sort(sortByLastname)
    const editorialFellows = allAuthors
      .filter((a) => a.editorial_fellow && !a.editorial_committee)
      .sort(sortByLastname)

    store.commit('setLoading', false)

    return {
      page,
      editorialCommittee,
      editorialFellows,
    }
  },
  data() {
    return {
      page: null,
      editorialCommittee: [],
      editorialFellows: [],
    }
  },
  async fetch() {
    this.page = await this.$content(
      'pages/' + this.$i18n.locale + '/editorial_policy'
    ).fetch()

    const allAuthors = await this.$content('authors', { deep: true })
      .where({
        $or: [{ editorial_fellow: true }, { editorial_committee: true }],
      })
      .fetch()

    const sortByLastname = (a, b) =>
      (a.lastname || '').localeCompare(b.lastname || '')

    this.editorialCommittee = allAuthors
      .filter((a) => a.editorial_committee)
      .sort(sortByLastname)
    this.editorialFellows = allAuthors
      .filter((a) => a.editorial_fellow && !a.editorial_committee)
      .sort(sortByLastname)

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
