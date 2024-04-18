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
      <nuxt-img
        v-bind="$attrs"
        fit="inside"
        :src="'/thumbnails/' + item.slug + '.png'"
        style="max-height: 100%; max-width: 100%"
      >
      </nuxt-img>
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
  },
}
</script>

<style lang="scss" scoped></style>
