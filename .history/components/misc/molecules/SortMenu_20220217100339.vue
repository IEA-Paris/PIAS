<template>
  <v-menu offset-y>
    <template #activator="{ on: menu, attrs }">
      <v-tooltip bottom>
        <template #activator="{ on: tooltip }">
          <v-btn
            x-large
            tile
            icon
            v-bind="attrs"
            class="mr-3"
            v-on="{ ...tooltip, ...menu }"
          >
            <v-icon> {{ currentIcon }}</v-icon>
          </v-btn>
        </template>
        <span>Latest {{ type }} first</span>
      </v-tooltip>
    </template>
    <v-list>
      <v-list-item
        v-for="(item, index) in items"
        :key="index"
        @click="updateSort(item.value)"
      >
        <v-list-item-icon>
          <v-icon>mdi-{{ item.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title>{{ $t(item.text) }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<script>
import lists from '~/assets/data/lists'
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
      items: lists[this.type].sort,
    }
  },
  computed: {
    currentIcon() {
      return Object.keys(this.items).find((item, index) => {
        return (
          ((this.$store.state[this.type].sortBy[0] === '' && index===0) ||
            this.items[item].value[0] ===
              this.$store.state[this.type].sortBy[0]) &&
         this.items[item].value[1] ===
            this.$store.state[this.type].sortDesc[0]
      )?.icon
    },
  },
  mounted() {},
  methods: {
    async updateSort(values) {
      await this.$store.dispatch(this.type + '/updateSort', values)
    },
  },
}
</script>
<style lang="scss"></style>
