<template v-slot:activator="{ on, attrs }">
  <v-text-field
    v-model.trim="val"
    v-bind="$attrs"
    :placeholder="item === 'search' ? $t('search') : ''"
    :prepend-inner-icon="item === 'search' ? 'mdi-magnify' : ''"
    single-line
    :loading="$wait.any"
    @click:clear="
      $router.push({ query: { ...$route.query, [item]: undefined } })
    "
  >
    <template
      v-if="item === 'search' && !($route.query && $route.query.search)"
      #label
    >
      <div class="searchLabel">{{ $t('search') }}</div>
    </template></v-text-field
  >
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      default: '',
      required: true,
    },
    item: {
      type: String,
      required: true,
      default: '',
    },
  },
  data() {
    return {}
  },

  computed: {
    val: {
      get() {
        return this.$store.state[this.type].search
      },
      set(value) {
        this.$store.dispatch(this.type + '/updateSearch', value)
      },
    },
  },
}
</script>
<style lang="scss"></style>
