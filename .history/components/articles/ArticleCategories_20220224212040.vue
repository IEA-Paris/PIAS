<template>
  <no-ssr>
    <v-chip
      v-if="item.category_1"
      :color="item.category_1.color"
      label
      class="white--text"
      v-bind="$attrs"
    >
      {{ item.category_1.title }}
    </v-chip>
    <v-chip
      v-if="item.category_2"
      :color="item.category_2.color"
      label
      class="white--text"
      v-bind="$attrs"
    >
      {{ item.category_2.title }}
    </v-chip>
  </no-ssr>
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
<style lang="scss"></style>
