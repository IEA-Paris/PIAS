<template>
  <aside class="transition-swing">
    <div
      v-if="showReset"
      :class="$store.state.scrolled ? 'mr-0' : 'mr-1'"
      class="w-100 transition-swing mb-1"
    >
      <v-btn
        outlined
        x-large
        block
        :height="$vuetify.breakpoint.sm ? '40' : '56'"
        @click="$store.dispatch('resetState', type) && $emit('close')"
        ><v-icon left>mdi-autorenew</v-icon
        >{{ $t('reset-your-search-filters') }}</v-btn
      >
    </div>

    <v-sheet
      v-else
      :height="$vuetify.breakpoint.sm ? '40' : '56'"
      block
      class="search-label mt-1"
    >
      <v-icon small color="black" left>mdi-filter</v-icon>
      {{ $t('filters') }}
    </v-sheet>

    <component
      :is="filters[filter].type"
      v-for="(filter, name) in Object.keys(filters)"
      v-show="name < 3 || expanded"
      :key="name + type + filter"
      hide-details
      :dense="$vuetify.breakpoint.sm"
      :items="filters[filter].items.map((item) => $t(item))"
      clearable
      :label="$t(filter)"
      min-height="56"
      outlined
      :loading="$store.state[type].loading.includes(filter)"
      :type="type"
      :filter="filter"
      color="black"
      style="min-width: 150px"
      class="transition-swing pb-1"
      :class="
        $store.state.scrolled
          ? 'mt-6'
          : $store.state[type].filters &&
            $store.state[type].filters[filter] &&
            $store.state[type].filters[filter].length
          ? 'mt-1 mr-1'
          : 'mt-0 mr-1'
      "
    />
    <v-btn
      v-if="Object.keys(filters).length > 2"
      text
      tile
      class="ml-n3"
      small
      @click="expanded = !expanded"
    >
      <v-icon left>{{
        expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'
      }}</v-icon
      >{{ expanded ? $t('less-filters') : $t('see-more-filters') }}</v-btn
    >
  </aside>
</template>
<script>
import data from '~/generated/filters'
export default {
  props: {
    type: {
      type: String,
      default: '',
      required: true,
    },
  },
  data() {
    return {
      filters: data[this.type].filters,
      sorters: data[this.type].sort,
      expanded: false,
    }
  },
  computed: {
    showReset() {
      return this.$store.state[this.type].filtersCount
    },
  },
  created() {
    console.log('set', data[this.type])
  },
  mounted() {},
  methods: {},
}
</script>
<style lang="scss">
aside {
  position: sticky;
  top: 10px;
  width: 100%;
  left: 250;
  align-self: start;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  text-align: right;
}
.search-label {
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.6);
  font-family: 'Open sans', sans-serif;
  font-size: 16px;
}
</style>
