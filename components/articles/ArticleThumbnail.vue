<template>
  <Item v-bind="$attrs">
    <!--     <template v-if="hasContent('categories')" #categories>
      <slot name="categories"></slot>
    </template> -->
    <template v-if="hasContent('caption')" #caption>
      <slot name="caption"></slot>
    </template>
    <template v-if="hasContent('author')" #author>
      <slot name="author"></slot>
    </template>
    <template v-if="hasContent('date')" #date>
      <slot name="date"></slot>
    </template>
    <template #content>
      <img
        v-bind="$attrs"
        :src="'/thumbnails/' + item.slug + '.png'"
        :alt="item.article_title || 'Article thumbnail'"
        style="max-height: 100%; max-width: 100%"
        @error="handleImageError"
      />
    </template>
  </Item>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => {},
    },
    size: {
      type: [String, Number],
      default: '200px',
    },
  },
  data() {
    return {}
  },
  computed: {},
  mounted() {},
  methods: {
    hasContent(slot) {
      return !!this.$slots[slot]
    },
    handleImageError(event) {
      // Log the error for debugging
      console.warn(
        'Failed to load thumbnail for:',
        this.item.slug,
        '/thumbnails/' + this.item.slug + '.png'
      )
      // Optionally set a fallback image
      // event.target.src = '/path/to/fallback.png'
    },
  },
}
</script>

<style lang="scss" scoped></style>
