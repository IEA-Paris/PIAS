<template>
  <v-menu v-if="Object.keys(items).length > 1" offset-y>
    <template #activator="{ on: menu, attrs }">
      <v-tooltip bottom>
        <template #activator="{ on: tooltip }">
          <v-btn
            x-large
            tile
            icon
            v-bind="attrs"
            :class="{
              'mt-3': $vuetify.breakpoint.xs,
            }"
            v-on="{ ...tooltip, ...menu }"
          >
            <v-icon> mdi-{{ current.icon || defaultSort.icon }}</v-icon>
          </v-btn>
        </template>
        <span
          v-html="$t('sort-mode') + $t(current.text || defaultSort.text)"
        ></span>
      </v-tooltip>
    </template>
    <v-list>
      <v-subheader>{{ $t('sort-the-type-by', [$t(type)]) }} </v-subheader>
      <template v-for="(item, index) in items">
        <v-list-item
          v-if="item.text !== current.text"
          :key="index"
          @click="updateSort(item.value)"
        >
          <v-list-item-icon>
            <v-icon>mdi-{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ $t(item.text) }}</v-list-item-title>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>
<script>
import lists from '~/assets/data/lists'
export default {
  props: {
    type: {
      type: String,
      default: 'articles',
      required: true,
    },
  },
  data() {
    return {
      items: lists[this.type].sort,
      defaultSort:
        lists[this.type].sort[
          Object.keys(lists[this.type].sort).find(
            (item) => lists[this.type].sort[item].default === true
          )
        ],
    }
  },
  computed: {
    current() {
      try {
        const current =
          this.items[
            Object.keys(this.items).find((item) => {
              return (
                this.items[item].value.join('') ===
                (this.$store.state[this.type].sortBy[0] ||
                  this.defaultSort.value[0]) +
                  (this.$store.state[this.type].sortDesc ? 'desc' : 'asc')
              )
            })
          ] || this.items[Object.keys(this.items).find((item) => item.default)]
        return current
      } catch (error) {
        console.log('error: ', error)
        return this.items[Object.keys(this.items).find((item) => item.default)]
      }
    },
  },
  mounted() {},
  methods: {
    async updateSort(value) {
      await this.$store.dispatch('updateSort', { value, type: this.type })
    },
  },
}
</script>
<style lang="scss"></style>
