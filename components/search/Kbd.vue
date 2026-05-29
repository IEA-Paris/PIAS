<template>
  <kbd class="search-kbd">
    <slot></slot>
  </kbd>
</template>
<script>
export default {
  name: 'Kbd',
}
</script>
<style scoped lang="scss">
.search-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6em;
  height: 1.6em;
  padding: 0 0.45em;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.12) inset;
  white-space: nowrap;
}
</style>
