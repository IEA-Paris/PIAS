<template>
  <v-chip
    v-if="item.category_1 && item.category_1.title"
    :color="item.category_1.color"
    label
    class="white--text"
    v-bind="$attrs"
  >
    {{ item.category_1.title }}
  </v-chip>
  <v-chip
    v-if="item.category_2 && item.category_2.title"
    :color="item.category_2.color"
    label
    class="white--text"
    v-bind="$attrs"
  >
    {{ item.category_2.title }}
  </v-chip>
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
