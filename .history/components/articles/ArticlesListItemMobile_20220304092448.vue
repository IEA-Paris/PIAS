<template>
  <v-list-item
    nuxt
    :to="localePath('/articles/' + item.slug)"
    class="mb-6 d-inline-flex align-start pl-0"
    :class="index > 0 ? '' : ''"
    flat
  >
    <v-list-item-avatar
      v-if="$vuetify.breakpoint.mdAndUp || ($vuetify.breakpoint.sm && !filter)"
      x-large
      tile
      min-width="25%"
      height="100%"
    >
      <YoutubeThumbnail v-if="item.yt && item.yt.length" :item="item">
        <template #categories>
          <ArticleCategories :item="item" />
        </template>
        <template #date>
          <div class="d-flex">
            <v-sheet :color="item.category_1.color" class="sideline"></v-sheet>
            {{
              new Date(item.date).toLocaleDateString('EN', {
                timezone: 'UTC',
              })
            }}
          </div>
        </template>
      </YoutubeThumbnail>
      <PictureItem
        v-else-if="item.picture && item.picture.length"
        :item="item"
        :src="item.picture"
      >
        <template #categories>
          <ArticleCategories :item="item" />
        </template>
        <template #date>
          <div class="d-flex">
            <v-sheet :color="item.category_1.color" class="sideline"></v-sheet>
            {{
              new Date(item.date).toLocaleDateString('EN', {
                timezone: 'UTC',
              })
            }}
          </div>
        </template>
      </PictureItem>
      <TextFingerprint v-else :item="item" :size="300" :margin="20">
        <template #categories>
          <ArticleCategories :item="item" />
        </template>
        <template #date>
          <div class="d-flex">
            <v-sheet :color="item.category_1.color" class="sideline"></v-sheet>
            {{
              new Date(item.date).toLocaleDateString('EN', {
                timezone: 'UTC',
              })
            }}
          </div>
        </template>
      </TextFingerprint>
    </v-list-item-avatar>
    <v-list-item-title class="d-flex flex-column">
      <div>
        <ArticleCategories
          v-if="$vuetify.breakpoint.xs || ($vuetify.breakpoint.sm && filter)"
          :item="item"
          class="pr-2 d-inline-flex"
          small
        />
        {{ item.article_title }}
      </div>
    </v-list-item-title>
    <v-list-item-subtitle class="mt-3 d-flex">
      <template
        v-if="$vuetify.breakpoint.xs || ($vuetify.breakpoint.sm && filter)"
      >
        {{
          new Date(item.date).toLocaleDateString('EN', {
            timezone: 'UTC',
          })
        }}
        -
      </template>
      <ArticleAuthorsString :authors="item.authors" class=""
    /></v-list-item-subtitle>
  </v-list-item>
</template>
<script>
export default {
  props: {
    item: {
      required: true,
      type: Object,
    },
    filter: {
      required: false,
      type: Boolean,
      default: false,
    },
    index: {
      required: true,
      type: Number,
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
<style lang="scss" scoped>
.article-mobile-title.small {
  font-size: 1rem;
}
.article-mobile-title {
  font-size: 1.3rem;
}
</style>
