<template>
  <v-select
    v-bind="$attrs"
    :ref="type + filter"
    v-model="selected"
    v-scroll="blur"
    menu-props="offset-y"
    :multiple="multiple"
  >
    <template #selection="{ item, index }">
      <SelectionSlot
        :label="false"
        :items="selected"
        :index="index"
        :item="item"
      /> </template
  ></v-select>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      default: '',
      required: true,
    },
    filter: {
      type: String,
      default: '',
      required: true,
    },
    multiple: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {}
  },

  computed: {
    selected: {
      get() {
        return this.$store.state[this.type].filters[this.filter]
      },
      set(value) {
        this.$store.dispatch('updateFilters', {
          filters: { [this.filter]: value },
          type: this.type,
        })
      },
    },
  },
  created() {},
  beforeCreate() {},
  methods: {
    blur() {
      this.$refs[this.type + this.filter].blur()
    },
  },
}
</script>
<style scoped></style>
