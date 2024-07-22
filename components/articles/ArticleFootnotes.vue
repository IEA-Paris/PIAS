<template>
  <v-list two-line max-width="650px" class="pl-0">
    <v-list-item
      v-for="(footnote, index) in item.footnotes"
      :key="index"
      nuxt
      class="pl-0"
    >
      <v-list-item-content>
        <nuxt-content :document="footnote" style="max-width: 650px" />
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>
<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => {},
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
