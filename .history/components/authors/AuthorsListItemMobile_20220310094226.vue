<template>
  <div>
    <v-skeleton-loader
      v-if="$store.state.loading && index % 2"
      :type="
        $vuetify.breakpoint.sm && !filter
          ? 'list-item-avatar-three-line'
          : 'list-item-three-line'
      "
      tile
    ></v-skeleton-loader>
    <v-list-item
      v-else
      nuxt
      :to="localePath('/authors/' + item.slug)"
      class="mb-6 d-flex align-start pl-0"
      :class="index > 0 ? '' : ''"
      flat
    >
      <v-list-item-avatar
        v-if="
          $vuetify.breakpoint.mdAndUp || ($vuetify.breakpoint.sm && !filter)
        "
        x-large
        tile
        min-width="25%"
        height="100%"
      >
        <OptimizedImage
          v-if="item.image"
          alt="Avatar"
          :src="item.image"
          :height="$vuetify.breakpoint.xl ? '180' : '120'"
          :ratio="1"
        />
        <v-icon v-else class="white--text headline author-picture">{{
          item.firstname[0] + item.lastname[0]
        }}</v-icon>
      </v-list-item-avatar>
      <div>
        <div
          class="text-h6 article-mobile-title"
          :class="
            $vuetify.breakpoint.xs || ($vuetify.breakpoint.sm && filter)
              ? ' small'
              : ''
          "
        >
          <!--          <ArticleCategories
            v-if="$vuetify.breakpoint.xs || ($vuetify.breakpoint.sm && filter)"
            :item="item"
            class="pr-2"
            small
          /> -->
          {{ item.article_title }}
        </div>
        <v-list-item-subtitle class="mt-2 d-inline-flex text-subtitle-1">
          <template
            v-if="$vuetify.breakpoint.xs || ($vuetify.breakpoint.sm && filter)"
          >
            {{
              new Date(item.date).toLocaleDateString('en-GB', {
                // you can use undefined as first argument
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
            }}
            -
          </template>
          <ArticleAuthorsString
            v-if="item.authors"
            :authors="item.authors"
            class=""
        /></v-list-item-subtitle>
      </div>
    </v-list-item>
  </div>
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
.author-mobile-title.small {
  font-size: 1rem;
}
.author-mobile-title {
  font-size: 1.3rem;
  margin-top: 0.1rem;
}
</style>
