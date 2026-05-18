<template>
  <v-row v-if="items && items.length" justify="center">
    <v-col cols="12">
      <v-row>
        <v-col
          v-for="(item, index) in items"
          :key="'committee-' + item.slug"
          cols="12"
        >
          <AuthorsListItem :item="item" :index="index" />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
<script>
export default {
  data() {
    return {
      items: [],
    }
  },
  async fetch() {
    const allAuthors = await this.$content('authors', { deep: true })
      .where({ editorial_committee: true })
      .fetch()

    const sortByLastname = (a, b) =>
      (a.lastname || '').localeCompare(b.lastname || '')

    this.items = allAuthors.sort(sortByLastname)
  },
  watch: {
    '$i18n.locale': '$fetch',
  },
}
</script>
