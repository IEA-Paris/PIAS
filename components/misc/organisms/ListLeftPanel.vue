<template>
  <div class="d-flex flex-column">
    <FiltersDialog
      v-if="$vuetify.breakpoint.xs"
      v-model="filter"
      :type="type"
      :filter-count="filtersCount"
    />
    <div v-if="$vuetify.breakpoint.smAndUp" class="d-inline-flex sidebtn">
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            tile
            outlined
            text
            v-bind="attrs"
            class="pa-7 mb-0"
            @click="filter = !filter"
            v-on="on"
          >
            <v-icon :left="!filter" :large="filter">
              {{ filter ? 'mdi-chevron-left' : 'mdi-filter' }}
            </v-icon>
            {{ filter ? '' : $t('filters') }}
            <!-- {{ $vuetify.breakpoint.name }} -->
          </v-btn>
        </template>
        <span v-html="filter ? $t('hide-filters') : $t('show-filters')"></span>
      </v-tooltip>
    </div>

    <!--   <IconMenu menu-type="view" :type="type"></IconMenu> -->
    <v-row
      class="transition-swing d-flex"
      :fluid="filter"
      :class="{
        'justify-center': $vuetify.breakpoint.lgAndUp,
        'flex-row-reverse': $vuetify.breakpoint.smAndUp,
      }"
      :no-gutters="$vuetify.breakpoint.mobile"
    >
      <v-col
        cols="12"
        :xl="filter ? 8 : 10"
        :lg="filter ? 9 : 11"
        :md="filter ? 9 : 12"
        :sm="filter ? 7 : 12"
        class="transition-swing pt-0"
        :class="{
          'pl-0': filter || $vuetify.breakpoint.xs,
        }"
      >
        <v-container
          class="transition-swing pt-0"
          :fluid="!$store.state.scrolled"
          :class="{
            'px-0 mb-3': $store.state.scrolled && $vuetify.breakpoint.xs,
            'pb-0': $vuetify.breakpoint.smAndUp,
            'ml-0': filter,
          }"
        >
          <v-row
            class="transition-swing"
            :no-gutters="!$store.state.scrolled || $vuetify.breakpoint.xs"
          >
            <v-col cols="12 transition-swing">
              <div class="text-right">
                <ViewMenu :type="type"></ViewMenu>
                <SortMenu :type="type"></SortMenu>
              </div>
              <div class="mr-4 text-subtitle-1 grey--text">
                <v-skeleton-loader
                  v-if="$store.state.loading"
                  max-width="300"
                  class="mb-1"
                  type="text"
                ></v-skeleton-loader>
                <template v-else>
                  <template v-if="filtersCount && !(search && search.length)">
                    {{ $t('searching') }}
                  </template>
                  <template v-if="search">
                    {{ $t('searching-for-string', [search]) }}
                  </template>
                  <template v-if="filtersCount"
                    >{{ $tc('with-activefilters-filters', [filtersCount]) }}
                  </template>
                  <!--  TODO add sort & view info -->
                  <!--            <template v-if="sortBy">
                  Sorted by {{$t(sortBy[0])}} ()
               </template> -->
                  <template v-if="filtersCount || search">- </template>
                  {{
                    $tc('total-' + type, total) +
                    ' - ' +
                    $t('page-current-of-total', {
                      current: page,
                      total: numberOfPages,
                    })
                  }}
                  <component
                    :is="
                      type.charAt(0).toUpperCase() +
                      type.slice(1) +
                      'SearchHint'
                    "
                    outline
                  ></component>
                </template>
              </div>
              <div class="d-flex">
                <!--            <v-btn
                  v-if="type === 'authors'"
                  outlined
                  :class="{ 'mt-3': $store.state.scrolled }"
                  class="transition-swing"
                  :small="$vuetify.breakpoint.smAndDown"
                  style="height: auto"
                  ><v-icon>mdi-alphabetical-variant</v-icon></v-btn
                > -->
                <v-text-field
                  v-model.trim="search"
                  :placeholder="$t('search-type', [$t(type)])"
                  prepend-inner-icon="mdi-magnify"
                  single-line
                  color="black"
                  :loading="$nuxt.loading || $store.state.loading"
                  class="transition-swing"
                  :class="{ 'mt-3': $store.state.scrolled }"
                  outlined
                  hide-details
                  :dense="$vuetify.breakpoint.smAndDown"
                  clearable
                  style="min-width: 150px"
                >
                  <template v-if="!search" #label>
                    <div class="searchLabel">
                      {{ $t('search-type', [$t(type)]) }}
                    </div>
                  </template></v-text-field
                >
              </div>
              <!-- <template v-if="type === 'authors'">
                <AuthorNamePicker @letter="letter = $event"></AuthorNamePicker>
                <v-divider></v-divider> </template> --></v-col
            ></v-row
          ></v-container
        >

        <FrontTiles
          v-if="view === 'tiles'"
          :data="{ items, total }"
          :filter="filter"
          :sections="Math.ceil(itemsPerPage / 3)"
          :type="type"
        ></FrontTiles>
        <list-items
          v-else-if="view === 'list'"
          :data="{ items, total }"
          :filter="filter"
          :type="type"
        ></list-items>
        <DisplayByIssue
          v-else-if="view === 'issues'"
          :data="{
            items,
            total,
            issues,
          }"
          :filter="filter"
          :type="type"
        ></DisplayByIssue>
        <RegularList
          v-else
          :data="{ items, total }"
          :filter="filter"
          :type="type"
        ></RegularList>
        <template v-if="items.length === 0 && $store.state.loading">
          <div width="100%" class="my-6 ml-6">
            <Loader></Loader>
          </div>
        </template>
        <!-- TODO update for equivalent after removing datatable -->
        <v-container
          class="transition-swing mb-12"
          :fluid="!$store.state.scrolled"
          :class="{
            'py-0': !$store.state.scrolled,
            'mt-6': $store.state.loading,
          }"
        >
          <v-row
            v-if="items.length === 0"
            class="transition-swing mx-0"
            :no-gutters="!$store.state.scrolled"
          >
            <template v-if="!filtersCount">
              <div class="my-6 ml-6">
                {{ $t('no-result-found') }}
              </div>
            </template>
            <div v-else class="my-6 ml-12">
              {{ $t('no-result-matching-your-filters') }}
              <br />
              <v-btn
                outlined
                class="my-6"
                @click="$store.dispatch('resetState', type)"
              >
                <v-icon left>mdi-refresh</v-icon>
                {{ $t('reset-filters') }}
              </v-btn>
            </div>
          </v-row></v-container
        >
      </v-col>
      <v-col
        v-if="$vuetify.breakpoint.smAndUp && filter"
        :cols="filter ? 2 : 1"
        :xl="filter ? 2 : 1"
        :lg="filter ? 3 : 1"
        :md="filter ? 3 : 1"
        :sm="filter ? 5 : 1"
        class="transition-swing pr-0"
      >
        <v-row class="transition-swing pl-3 pr-0 fill-height">
          <v-col cols="12" :class="filtersSpacing" class="mt-12">
            <Filters :type="type" /></v-col
        ></v-row>
      </v-col>
    </v-row>

    <v-container
      v-if="!$store.state.loading"
      class="footer-pagination d-flex transition-swing"
      :class="[
        $vuetify.breakpoint.smAndDown
          ? 'flex-column-reverse align-center'
          : 'justify-space-between',
        { unpadded: !filter },
      ]"
    >
      <div
        class="perpage-select"
        :class="$vuetify.breakpoint.smAndDown ? 'text-center' : ''"
      >
        <span
          class="grey--text pr-3"
          :class="{ 'ml-6': !$store.state.scrolled }"
          >{{ $t('items-per-page') }}</span
        >
        <v-select
          v-model="itemsPerPage"
          class="perPageSelect"
          solo
          outlined
          flat
          dense
          :items="$store.state[type].itemsPerPageArray"
          hide-details
        ></v-select>
      </div>
      <div class="text-center">
        <Pagination
          v-if="numberOfPages > 1"
          :type="type"
          color="black"
          large
          :current-page="page"
          :total-pages="numberOfPages"
          :page-padding="1"
          :page-gap="2"
          :hide-prev-next="false"
        ></Pagination>
      </div>
    </v-container>
  </div>
</template>
<script>
import rawFilters from '~/generated/filters'

import debounce from '~/assets/utils/debounce'
export default {
  props: {
    addBtn: {
      type: Boolean,
      required: false,
      default: false,
    },
    type: {
      type: String,
      default: '',
      required: true,
    },
    layout: {
      type: Object,
      required: true,
      default: () => {
        return {
          cols: 12,
          xl: 12,
        }
      },
    },
    pagination: {
      type: Object,
      required: false,
      default: () => {
        return {}
      },
    },
    addButton: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  asyncData({ $content, params, payload }) {
    console.log('payload: ', payload)

    return {}
  },
  data() {
    return {
      letter: null,
      filter: this.$store.state[this.type].filtersCount > 0,
      debouncedSearch: debounce(function (v) {
        this.$store.dispatch('updateSearch', { search: v, type: this.type })
        this.$vuetify.goTo(0)
      }, 200),
    }
  },
  async fetch({ params, store: { dispatch, getters } }) {
    await dispatch('update', this.type)
  },
  computed: {
    issues() {
      return rawFilters.articles.filters.issue.items.filter((issue) =>
        this.items.find((item) => item.issue.slice(15, -3) === issue.value)
      )
    },
    filtersSpacing() {
      const scrolled = this.$store.state.scrolled
      switch (this.$vuetify.breakpoint.name) {
        case 'sm':
          return scrolled ? 'pt-13 pr-3' : 'pt-11 pr-0'

        case 'md':
          return scrolled ? 'pt-14 pr-5' : 'pt-11 pr-0'

        case 'lg':
          return scrolled ? 'pt-11 pr-2' : 'pt-8 pr-0'

        case 'xl':
          return scrolled ? 'pt-10 pr-3' : 'pt-8 pr-0'

        default:
          return 'pt-10 pr-3'
      }
    },
    view() {
      return this.$store.state[this.type].view
    },
    itemsPerPage: {
      get() {
        return this.$store.state[this.type].itemsPerPage
      },
      async set(v) {
        await this.$store.dispatch('updateItemsPerPage', {
          value: v,
          type: this.type,
        })
        this.$vuetify.goTo(0)
      },
    },
    search: {
      get() {
        return this.$store.state[this.type].search
      },
      set(v) {
        this.debouncedSearch(v)
      },
    },
    display: {
      get() {
        return this.$store.state[this.type].display
      },
      async set(v) {
        await this.$store.dispatch('update', { display: v, type: this.type })
        this.$vuetify.goTo(0)
      },
    },
    total() {
      return this.$store.state[this.type].total
    },

    numberOfPages() {
      return this.$store.state[this.type].numberOfPages
    },
    page() {
      return +this.$store.state[this.type].page
    },
    sortBy() {
      return this.$store.state[this.type].sortBy
    },
    sortDesc() {
      return this.$store.state[this.type].sortDesc[0] !== 'asc'
        ? [false]
        : [true]
    },
    filtersCount() {
      return this.$store.state[this.type].filtersCount
    },
    items() {
      return this.$store.state[this.type].items
    },
  },
  async mounted() {
    // Load route query and params if not already loaded during SSR
    this.$store.commit('loadRouteQueryAndParams', this.type)

    // Set filter state based on current filters and query
    this.filter =
      this.$store.state[this.type].filtersCount > 0 ||
      (this.$route.query.filters &&
        Object.keys(this.$route.query.filters).length > 0) ||
      this.$route.query?.search?.length > 0

    // Only update store if items are not already loaded (e.g., during CSR navigation)
    if (!this.$store.state[this.type].items.length) {
      await this.$store.dispatch('update', this.type)
    }
  },
  updated() {},
  methods: {},
}
</script>
<style lang="scss">
.unpadded {
  // TODO Fix animation. Rather than :fluid="filter", it seems that applying this at css level produced a more satisfying animation. It mitigates the glitch making the filters appear below the list before going to the right place. It remains to be fully fixed
  max-width: 100%;
}
.sidebtn {
  position: sticky;
  display: block;
  align-self: flex-start;
  top: 0;
  overflow-y: auto;
  top: 0;
  background-color: white;
  z-index: 4;
  align-self: flex-start;
  margin-left: -1.5rem;
  margin-right: -1.5rem;
  overflow: hidden;
  margin-bottom: 10px;
  margin-bottom: 0px;
}
.perPageSelect {
  max-width: 90px;
  margin-top: 0;
  padding-top: 0;
}
.searchLabel {
  text-transform: uppercase !important;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.6) !important;
}
.footer-pagination {
  display: flex;
  align-content: center;
  justify-items: center;
}
.footer-pagination::after {
  content: '';
  order: 1;
  width: 90px;
}
.perpage-select {
  order: 0;
}
</style>
