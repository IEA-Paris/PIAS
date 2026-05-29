<template>
  <v-dialog v-model="open" fullscreen hide-overlay overflowed>
    <template #activator="{ on: dialogOn, attrs: dialogAttrs }">
      <v-tooltip bottom>
        <template #activator="{ on: tooltipOn, attrs: tooltipAttrs }">
          <v-btn
            v-bind="{ ...dialogAttrs, ...tooltipAttrs }"
            icon
            x-large
            class="ma-2"
            tile
            :aria-label="$t('aria.open-search')"
            :aria-keyshortcuts="shortcutModifier + '+K'"
            v-on="{ ...dialogOn, ...tooltipOn }"
          >
            <v-icon color="black">mdi-magnify</v-icon>
          </v-btn>
        </template>
        <span class="search-activator__tooltip">
          {{ $t('aria.open-search') }}
          <span class="search-activator__shortcut">
            <Kbd>{{ shortcutSymbol }}</Kbd
            ><Kbd>K</Kbd>
          </span>
        </span>
      </v-tooltip>
    </template>
    <v-card dark color="rgba(0, 0, 0, 0.97)">
      <v-app-bar color="transparent" clipped flat hide-on-scroll height="140">
        <div class="d-flex flex-column flex-grow-1">
          <div class="d-flex flex-grow-1 align-start">
            <v-img
              class="mr-2 mt-4 logo-container-white"
              :src="$config.logo_alt"
              contain
              max-height="120"
              max-width="120"
              style="cursor: pointer"
            ></v-img>
            <v-spacer></v-spacer>
            <v-btn
              icon
              x-large
              class="ma-2 mr-2 mb-4"
              tile
              :aria-label="$t('aria.close-search')"
              @click="open = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </v-app-bar>
      <v-container fill-height>
        <v-row align="center" justify="center">
          <v-col
            cols="12"
            md="9"
            lg="6"
            class="d-flex justify-center flex-column"
          >
            <PageTitle :text="$t('search')"></PageTitle>
            <v-text-field
              id="search"
              ref="searchInput"
              v-model="searchString"
              v-intersect="onIntersect"
              name="search"
              hide-details
              clearable
              outlined
              :placeholder="$t('search-placeholder')"
              prepend-inner-icon="mdi-magnify"
              class="search"
              role="combobox"
              aria-autocomplete="list"
              :aria-expanded="hasResults"
              @keydown.esc.prevent="clear()"
              @keydown.down.prevent="moveHighlight(1)"
              @keydown.up.prevent="moveHighlight(-1)"
              @keydown.enter.prevent="openHighlighted()"
              @click:clear="searchString = ''"
            ></v-text-field>

            <!-- Keyboard hint legend -->
            <div class="search-legend mt-3" aria-hidden="true">
              <span class="search-legend__item">
                <Kbd>↑</Kbd><Kbd>↓</Kbd> {{ $t('search-hint-navigate') }}
              </span>
              <span class="search-legend__item">
                <Kbd>↵</Kbd> {{ $t('search-hint-open') }}
              </span>
              <span class="search-legend__item">
                <Kbd>esc</Kbd> {{ $t('search-hint-close') }}
              </span>
            </div>

            <!-- Preparing the search index (first interaction, cold cache) -->
            <div v-if="preparing" class="search-preparing mt-8">
              <v-progress-circular
                :size="32"
                width="3"
                color="primary"
                indeterminate
                class="mr-3"
              ></v-progress-circular>
              <span class="text-body-1">{{ $t('preparing-search') }}</span>
            </div>

            <!-- Empty state: what is searchable -->
            <div v-else-if="isEmpty && !loading" class="search-empty mt-8">
              <h2 class="text-h5 mb-2">{{ $t('search-empty-title') }}</h2>
              <p class="text-body-1 grey--text text--lighten-1 mb-6">
                {{ $t('search-empty-subtitle') }}
              </p>
              <div class="search-empty__scopes">
                <div class="search-empty__scope">
                  <ArticlesSearchHint :outline="true"></ArticlesSearchHint>
                  <span class="ml-2">{{ $t('articles') }}</span>
                </div>
                <div class="search-empty__scope">
                  <MediaSearchHint :outline="true"></MediaSearchHint>
                  <span class="ml-2">{{ $t('media') }}</span>
                </div>
                <div class="search-empty__scope">
                  <AuthorsSearchHint :outline="true"></AuthorsSearchHint>
                  <span class="ml-2">{{ $t('authors') }}</span>
                </div>
              </div>
            </div>

            <!-- No-results state -->
            <div
              v-else-if="!isEmpty && !loading && !hasResults"
              class="search-empty mt-8"
            >
              <h2 class="text-h6 mb-2">
                {{ $t('search-no-results', [searchStringRaw]) }}
              </h2>
              <p class="text-body-2 grey--text text--lighten-1">
                {{ $t('search-no-results-hint') }}
              </p>
            </div>

            <v-list v-else color="transparent">
              <template v-if="results.articles && results.articles.length">
                <v-subheader class="pr-0">
                  <ArticlesSearchHint></ArticlesSearchHint>&nbsp;
                  {{ $t('articles') }} <v-spacer></v-spacer
                  ><v-btn
                    v-if="results.articlesCount > 3"
                    small
                    text
                    nuxt
                    @click="seeAll('articles-page')"
                  >
                    {{
                      $t('see-all-results-articlescount', [
                        results.articlesCount,
                      ])
                    }}
                  </v-btn>
                </v-subheader>
                <template v-for="(item, index) in results.articles">
                  <v-list-item-group
                    v-if="results.articles.length"
                    :key="index + 'articles'"
                    color="primary"
                    template
                  >
                    <ArticleSearchItem
                      :item="item"
                      :class="{
                        'search-item--active': isHighlighted('articles', index),
                      }"
                      @close="open = false"
                    ></ArticleSearchItem>
                  </v-list-item-group>
                </template>
              </template>
              <template v-if="results.media && results.media.length">
                <v-divider></v-divider>
                <v-subheader>
                  <MediaSearchHint></MediaSearchHint> &nbsp; {{ $t('media')
                  }}<v-spacer></v-spacer
                  ><v-btn
                    v-if="results.mediaCount > 3"
                    small
                    text
                    @click="seeAll('media-page')"
                  >
                    {{
                      $t('see-all-results-articlescount', [results.mediaCount])
                    }}
                  </v-btn>
                </v-subheader>
                <template v-for="(item, index) in results.media">
                  <v-list-item-group
                    v-if="results.media.length"
                    :key="index + 'media'"
                    color="primary"
                    template
                  >
                    <MediaSearchItem
                      :item="item"
                      :class="{
                        'search-item--active': isHighlighted('media', index),
                      }"
                      @close="open = false"
                    ></MediaSearchItem>
                  </v-list-item-group>
                </template>
              </template>
              <template v-if="results.authors && results.authors.length">
                <v-divider></v-divider>
                <v-subheader>
                  <AuthorsSearchHint></AuthorsSearchHint>&nbsp;{{ $t('authors')
                  }}<v-spacer></v-spacer
                  ><v-btn
                    v-if="results.authorsCount > 3"
                    small
                    text
                    nuxt
                    @click="seeAll('authors-page')"
                  >
                    {{
                      $t('see-all-results-articlescount', [
                        results.authorsCount,
                      ])
                    }}
                  </v-btn>
                </v-subheader>
                <template v-for="(item, index) in results.authors">
                  <v-list-item-group
                    v-if="results.authors.length"
                    :key="index + 'authors'"
                    color="primary"
                    template
                  >
                    <AuthorSearchItem
                      :item="item"
                      :class="{
                        'search-item--active': isHighlighted('authors', index),
                      }"
                      @close="open = false"
                    ></AuthorSearchItem>
                  </v-list-item-group>
                </template>
              </template>
            </v-list>

            <v-progress-circular
              v-if="loading && !preparing"
              :size="50"
              color="primary"
              indeterminate
            ></v-progress-circular>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>
<script>
import searchContent from '~/assets/utils/searchContent'

const SEARCH_DEBOUNCE_MS = 250

const emptyResults = () => ({
  articles: [],
  media: [],
  authors: [],
  articlesCount: 0,
  mediaCount: 0,
  authorsCount: 0,
})

export default {
  props: {},
  data() {
    return {
      loading: false,
      results: emptyResults(),
      open: this.searchString,
      shouldFocus: false,
      base: this.$route.path,
      searchStringRaw: '',
      highlightIndex: -1,
      debounceTimer: null,
      isApple: false,
    }
  },
  computed: {
    searchString: {
      get() {
        return this.searchStringRaw
      },
      set(newValue) {
        this.searchStringRaw = newValue || ''
        this.highlightIndex = -1
        this.queueSearch(this.searchStringRaw)
      },
    },
    // Flat, ordered list of every visible result so arrow keys can walk
    // across the article / media / author sections seamlessly.
    flatResults() {
      const flat = []
      ;(this.results.articles || []).forEach((item, index) => {
        flat.push({ type: 'articles', index, to: '/article/' + item.slug })
      })
      ;(this.results.media || []).forEach((item, index) => {
        flat.push({
          type: 'media',
          index,
          to: '/article/' + item.article_slug + '#youtube_' + item.index,
        })
      })
      ;(this.results.authors || []).forEach((item, index) => {
        flat.push({ type: 'authors', index, to: '/author/' + item.slug })
      })
      return flat
    },
    hasResults() {
      return this.flatResults.length > 0
    },
    isEmpty() {
      return !this.searchStringRaw
    },
    shortcutSymbol() {
      return this.isApple ? '⌘' : 'Ctrl'
    },
    shortcutModifier() {
      return this.isApple ? 'Meta' : 'Control'
    },
    preparing() {
      return this.$store.state.preparingSearchIndex
    },
  },
  watch: {
    // Warm the search index cache the first time the dialog is opened,
    // whether via the activator button or the Cmd/Ctrl+K shortcut.
    open(isOpen) {
      if (isOpen) {
        this.$store.dispatch('prepareSearchIndex')
      }
    },
  },
  mounted() {
    this.isApple =
      typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
    window.addEventListener('keydown', this.onGlobalKeydown)
    if (this.$route.query.search) {
      this.searchString = this.$route.query.search
    }
    this.focusSearch()
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.onGlobalKeydown)
    clearTimeout(this.debounceTimer)
  },
  methods: {
    onGlobalKeydown(event) {
      // Cmd+K (macOS) / Ctrl+K (others) toggles the search dialog.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        this.open = !this.open
        if (this.open) {
          this.focusSearch()
        }
      }
    },
    queueSearch(value) {
      clearTimeout(this.debounceTimer)
      if (!value) {
        this.results = emptyResults()
        this.loading = false
        return
      }
      this.loading = true
      this.debounceTimer = setTimeout(() => {
        this.runSearch(value)
      }, SEARCH_DEBOUNCE_MS)
    },
    async runSearch(value) {
      if (this.$store.state.loading || this.$nuxt.loading) {
        this.loading = false
        return
      }
      // Guard against a stale response overwriting a newer query.
      if (value !== this.searchStringRaw) return
      try {
        const resultsRaw = await searchContent(this.$content, value)
        if (value !== this.searchStringRaw) return
        this.results = {
          articles: resultsRaw[0] || [],
          media: resultsRaw[1] || [],
          authors: resultsRaw[2] || [],
          articlesCount: (resultsRaw[3] || []).length || 0,
          mediaCount: (resultsRaw[4] || []).length || 0,
          authorsCount: (resultsRaw[5] || []).length || 0,
        }
      } finally {
        if (value === this.searchStringRaw) {
          this.loading = false
        }
      }
    },
    moveHighlight(direction) {
      if (!this.hasResults) return
      const count = this.flatResults.length
      this.highlightIndex = (this.highlightIndex + direction + count) % count
    },
    isHighlighted(type, index) {
      const current = this.flatResults[this.highlightIndex]
      return !!current && current.type === type && current.index === index
    },
    openHighlighted() {
      const target = this.flatResults[this.highlightIndex]
      if (!target) return
      this.open = false
      this.$router.push(this.localePath(target.to))
    },
    seeAll(name) {
      this.open = false
      this.$store.dispatch('updateSearch', {
        search: this.searchStringRaw,
        type: name,
      })

      this.$router.push(
        this.localePath({
          name,
          query: {
            search: this.searchStringRaw,
          },
        })
      )
    },
    focusSearch() {
      // Focus the component, but we have to wait
      // so that it will be showing first.
      this.$nextTick(() => {
        this.$refs?.searchInput?.focus()
      })
    },
    clear() {
      this.shouldFocus = false
      this.open = false
    },
    onIntersect(entries, observer) {
      // More information about these options
      // is located here: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
      this.shouldFocus = entries[0].isIntersecting
      if (this.shouldFocus) {
        this.$refs?.searchInput?.focus()
      }
    },
  },
}
</script>
<style scoped lang="scss">
$input-font-size: 48px;
.logo-container-white {
}
.menu-logo {
  transition-duration: 0.2s;
  transition-timing-function: ease-in-out;
  transition-property: color, background, text-shadow;
  transition: all 0.5s ease;
  transform-origin: left top;
  width: 600px !important;
  margin-left: 40px;
  margin-bottom: 25px;
}
#search {
  height: 120px;
  font-size: 48pt;
}
.search label[for] {
  height: 120px;
  font-size: 48pt;
}

.search-activator__tooltip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.search-activator__shortcut {
  display: inline-flex;
  gap: 2px;
}

.search-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
}

.search-empty {
  color: rgba(255, 255, 255, 0.85);

  &__scopes {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  &__scope {
    display: inline-flex;
    align-items: center;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.75);
  }
}

.search-preparing {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.85);
}

::v-deep .search-item--active .v-list-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}
</style>
