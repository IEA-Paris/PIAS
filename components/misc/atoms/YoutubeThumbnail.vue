<template>
  <Item style="background-color: black">
    <!--     <template #categories>
      <slot name="categories"></slot>
    </template> -->
    <template #caption>
      <slot name="caption"></slot>
    </template>
    <template #author>
      <slot name="author"></slot>
    </template>
    <template #date>
      <slot name="date"></slot>
    </template>
    <template #content>
      <Youtube class="yt-content" :yt="item.yt" nocontrols autoplay />
    </template>
  </Item>
</template>
<script>
// export component
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
  mounted() {},
  methods: {},
}
</script>

<style>
.yt-content {
  flex: 1;
}
</style>
