<template>
  <v-container
    v-scroll="onScroll"
    class="transition-swing pt-0"
    :class="[$store.state.scrolled ? 'mt-n4' : 'mt-n2', { 'ml-0': filter }]"
    :fluid="!$store.state.scrolled"
  >
    <v-row class="transition-swing" :no-gutters="!$store.state.scrolled">
      <v-col
        cols="12"
        :class="{
          'pt-0 pr-1': !$store.state.scrolled,
          'px-0': $vuetify.breakpoint.xs,
        }"
        class="transition-swing"
      >
        <div v-for="issue in issues" :key="issue.title">
          <div class="text-h4">
            <!--   TODO add highlight from search -->
            {{ issue.text }}
          </div>
          <v-list :key="issue.text" two-lines>
            <template v-if="$vuetify.breakpoint.smAndDown">
              <component
                :is="
                  type.charAt(0).toUpperCase() +
                  type.slice(1) +
                  'ListItemMobile'
                "
                v-for="(item, index) in getIssueItems(issue)"
                v-bind="$attrs"
                :key="index"
                :index="index"
                :item="item"
                highlighted
                :scroll="$store.state.scrolled"
                :filter="filter"
              ></component>
            </template>
            <component
              :is="type.charAt(0).toUpperCase() + type.slice(1) + 'ListItem'"
              v-for="(item, index) in getIssueItems(issue)"
              v-else
              v-bind="$attrs"
              :key="index"
              :index="index"
              :item="item"
              highlighted
              :scroll="$store.state.scrolled"
            ></component>
          </v-list>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  props: {
    data: {
      required: true,
      type: Object,
      default: () => {
        return { items: [], total: 0 }
      },
    },
    filter: {
      required: false,
      type: Boolean,
      default: false,
    },
    sections: {
      required: false,
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: '',
      required: true,
    },
  },
  data() {
    return {}
  },
  computed: {},
  created() {},
  methods: {
    onScroll() {
      this.$store.commit('setScrolled')
    },
    getIssueItems(issue) {
      return this.data.items.filter((item) => item.issue === issue)
    },
  },
}
</script>
<style lang="scss">
.h500 {
  max-height: 500;
}
</style>
,
