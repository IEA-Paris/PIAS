<template>
  <v-list-item
    nuxt
    :to="localePath('/article/' + item.slug)"
    @click="$emit('close')"
  >
    <v-list-item-avatar tile class="mr-8">
      <YoutubeThumbnail v-if="item.yt && item.yt.length" :item="item">
      </YoutubeThumbnail>
      <PictureItem
        v-else-if="item.picture && item.picture.length"
        :item="item"
        :src="item.picture"
      >
      </PictureItem>
      <ArticleThumbnail v-else :item="item" :size="100" :margin="20">
      </ArticleThumbnail>
    </v-list-item-avatar>
    <v-list-item-content>
      <v-list-item-title class="text-h6">
        {{ item.article_title }}
      </v-list-item-title>
      <v-list-item-subtitle>
        <ArticleAuthorsString :authors="item.authors" />
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>
<script>
export default {
  props: {
    item: {
      required: true,
      type: Object,
    },
  },
  data() {
    return {}
  },
  computed: {},
  mounted() {},
  methods: {},
}
</script>
<style lang="scss">
.graphIcon {
  display: flex;
  max-width: 120px;
  background-color: black;
}
</style>
