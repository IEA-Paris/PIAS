<template>
  <v-card
    nuxt
    :to="localePath('/articles/' + item.slug)"
    @click="$emit('close')"
  >
    <v-list-item-avatar tile>
      <YoutubeThumbnail v-if="item.yt && item.yt.length" :item="item">
      </YoutubeThumbnail>
      <PictureItem
        v-else-if="item.picture && item.picture.length"
        :item="item"
        :src="item.picture"
      >
      </PictureItem>
      <TextFingerprint v-else :item="item" :size="100" :margin="20">
      </TextFingerprint>
    </v-list-item-avatar>
    <v-list-item-content>
      <v-list-item-title>
        {{ item.article_title }}
      </v-list-item-title>
      <v-list-item-subtitle>
        <ArticleAuthorsString :authors="item.authors" />
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-card>
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
  max-width: 90px;
  background-color: black;
}
</style>
