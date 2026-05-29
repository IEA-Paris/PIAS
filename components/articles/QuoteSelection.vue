<template>
  <client-only>
    <div>
      <!-- Floating "Quote" trigger that follows the text selection -->
      <div
        v-show="showButton"
        ref="floater"
        class="quote-floater"
        :style="floaterStyle"
      >
        <v-btn
          color="primary"
          small
          tile
          elevation="6"
          :aria-label="$t('quote-selection')"
          @mousedown.prevent
          @click="openMenu"
        >
          <v-icon left small>mdi-format-quote-close</v-icon>
          {{ $t('quote') }}
        </v-btn>
      </div>

      <!-- Quote composer dialog -->
      <v-dialog
        v-model="dialog"
        max-width="640"
        scrollable
        :retain-focus="false"
      >
        <v-card>
          <v-toolbar flat dense>
            <v-icon left>mdi-format-quote-open</v-icon>
            <v-toolbar-title class="text-h6">
              {{ $t('quote-this-passage') }}
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              icon
              :aria-label="$t('aria.close-dialog')"
              @click="dialog = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>

          <v-divider></v-divider>

          <v-card-text class="pt-4" style="max-height: 60vh">
            <!-- The quoted passage -->
            <blockquote class="quote-block pa-4 mb-4">
              <p class="mb-2 font-italic text-body-2">“{{ selectedText }}”</p>
              <footer class="text-caption text--secondary">
                — {{ attribution }}
              </footer>
            </blockquote>

            <!-- Options -->
            <v-checkbox
              v-model="includeCitation"
              dense
              hide-details
              class="mt-0"
              :label="$t('include-full-citation')"
            ></v-checkbox>
            <v-checkbox
              v-model="includePermalink"
              dense
              hide-details
              :label="$t('include-permalink-to-passage')"
            ></v-checkbox>

            <v-sheet
              v-if="includeCitation"
              outlined
              rounded
              class="pa-3 mt-3 text-caption"
              v-html="renderedCitation"
            ></v-sheet>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="flex-wrap" style="gap: 4px">
            <v-btn text small @click="copyQuote">
              <v-icon left small>
                {{ copied ? 'mdi-check' : 'mdi-content-copy' }}
              </v-icon>
              {{ $t('copy-quote') }}
            </v-btn>
            <v-btn text small @click="copyPermalink">
              <v-icon left small>mdi-link-variant</v-icon>
              {{ $t('copy-permalink') }}
            </v-btn>
            <v-spacer></v-spacer>

            <!-- Share targets -->
            <v-menu top offset-y>
              <template #activator="{ on, attrs }">
                <v-btn text small v-bind="attrs" v-on="on">
                  <v-icon left small>mdi-share-variant</v-icon>
                  {{ $t('share') }}
                </v-btn>
              </template>
              <v-list dense>
                <v-list-item
                  v-for="target in shareTargets"
                  :key="target.key"
                  :href="target.href"
                  target="_blank"
                  rel="noopener"
                >
                  <v-list-item-icon class="mr-2">
                    <v-icon small>{{ target.icon }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>{{ target.label }}</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="canNativeShare" @click="nativeShare">
                  <v-list-item-icon class="mr-2">
                    <v-icon small>mdi-dots-horizontal</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>{{ $t('more') }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="snackbar" timeout="2000" bottom>
        {{ snackbarText }}
      </v-snackbar>
    </div>
  </client-only>
</template>

<script>
import config from '~/config'
import { writeClipboard } from '~/assets/utils/clipboard'

export default {
  props: {
    item: {
      type: Object,
      required: true,
    },
    // CSS selector for the article body the user can quote from.
    contentSelector: {
      type: String,
      default: '.nuxt-content',
    },
  },
  data() {
    return {
      selectedText: '',
      showButton: false,
      floaterStyle: { top: '0px', left: '0px' },
      dialog: false,
      includeCitation: false,
      includePermalink: true,
      copied: false,
      snackbar: false,
      snackbarText: '',
    }
  },
  computed: {
    attribution() {
      const authors = (this.item.authors || [])
        .map((a) => `${a.firstname} ${a.lastname}`)
        .join(', ')
      const year = this.item.date ? new Date(this.item.date).getFullYear() : ''
      return [authors, this.item.article_title, this.journalName, year]
        .filter(Boolean)
        .join(', ')
    },
    journalName() {
      return config.full_name || config.name || 'PIAS'
    },
    activeStyle() {
      return Object.keys(this.item.toCite || {})[0] || 'apa'
    },
    renderedCitation() {
      const map = this.item.toCite || {}
      return map[this.activeStyle] || ''
    },
    plainCitation() {
      return String(this.renderedCitation || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&#38;|&amp;/g, '&')
        .trim()
    },
    baseUrl() {
      if (typeof window !== 'undefined') {
        return window.location.href.split('#')[0]
      }
      return `https://pias.science/article/${this.item.slug}`
    },
    // A deep link to the exact passage using the URL Text Fragments standard
    // (https://wicg.github.io/scroll-to-text-fragment/). Falls back to a
    // plain article link in browsers that ignore the fragment.
    permalink() {
      const text = this.selectedText.trim()
      if (!text) return this.baseUrl
      // Keep the fragment short & robust: anchor on the first ~8 words.
      const snippet = text.split(/\s+/).slice(0, 8).join(' ')
      return `${this.baseUrl}#:~:text=${encodeURIComponent(snippet)}`
    },
    formattedQuote() {
      const parts = [`“${this.selectedText.trim()}”`]
      parts.push(`— ${this.attribution}`)
      if (this.includeCitation && this.plainCitation) {
        parts.push(this.plainCitation)
      }
      if (this.includePermalink) parts.push(this.permalink)
      return parts.join('\n')
    },
    shareTargets() {
      const url = encodeURIComponent(this.permalink)
      const quote = `“${this.selectedText.trim()}” — ${this.attribution}`
      const text = encodeURIComponent(quote)
      return [
        {
          key: 'twitter',
          label: 'X / Twitter',
          icon: 'mdi-twitter',
          href: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        },
        {
          key: 'bluesky',
          label: 'Bluesky',
          icon: 'mdi-cloud',
          href: `https://bsky.app/intent/compose?text=${encodeURIComponent(
            quote + ' ' + this.permalink
          )}`,
        },
        {
          key: 'mastodon',
          label: 'Mastodon',
          icon: 'mdi-mastodon',
          href: `https://mastodon.social/share?text=${encodeURIComponent(
            quote + ' ' + this.permalink
          )}`,
        },
        {
          key: 'linkedin',
          label: 'LinkedIn',
          icon: 'mdi-linkedin',
          href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        },
        {
          key: 'email',
          label: this.$t('email') || 'Email',
          icon: 'mdi-email-outline',
          href: `mailto:?subject=${encodeURIComponent(
            this.item.article_title || ''
          )}&body=${encodeURIComponent(this.formattedQuote)}`,
        },
      ]
    },
    canNativeShare() {
      return typeof navigator !== 'undefined' && !!navigator.share
    },
  },
  mounted() {
    // Teleport the floater to <body> so its `position: fixed` is resolved
    // against the viewport, not against any transformed/positioned ancestor
    // in the article tree (which is what pushed it to the bottom of the page).
    if (this.$refs.floater) document.body.appendChild(this.$refs.floater)
    document.addEventListener('selectionchange', this.onSelectionChange)
    document.addEventListener('mousedown', this.onMouseDown)
    // Hide the button when the viewport changes under the selection.
    window.addEventListener('scroll', this.hide, { passive: true })
    window.addEventListener('resize', this.hide, { passive: true })
  },
  beforeDestroy() {
    document.removeEventListener('selectionchange', this.onSelectionChange)
    document.removeEventListener('mousedown', this.onMouseDown)
    window.removeEventListener('scroll', this.hide)
    window.removeEventListener('resize', this.hide)
    // Remove the teleported node we appended to <body>.
    if (this.$refs.floater && this.$refs.floater.parentNode === document.body) {
      document.body.removeChild(this.$refs.floater)
    }
  },
  methods: {
    onMouseDown(e) {
      // Clicking anywhere other than the floater dismisses it.
      if (this.$refs.floater && this.$refs.floater.contains(e.target)) return
      this.showButton = false
    },
    onSelectionChange() {
      // Debounce to the end of the current task; selection fires rapidly.
      clearTimeout(this._t)
      this._t = setTimeout(this.evaluateSelection, 120)
    },
    evaluateSelection() {
      if (this.dialog) return
      const selection = window.getSelection()
      const text = selection ? selection.toString().trim() : ''
      const container = document.querySelector(this.contentSelector)

      if (!text || text.length < 3 || !selection.rangeCount || !container) {
        this.showButton = false
        return
      }

      // Only react to selections inside the article body.
      const range = selection.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) {
        this.showButton = false
        return
      }

      this.selectedText = text.replace(/\s+/g, ' ')

      // Anchor the button to where the selection actually ends, not the
      // centre of the whole (possibly multi-line) bounding box. getClientRects
      // returns one rect per line; the last one is where the user stopped.
      const rects = range.getClientRects()
      const rect = rects.length
        ? rects[rects.length - 1]
        : range.getBoundingClientRect()
      if (!rect || (!rect.width && !rect.height)) {
        this.showButton = false
        return
      }
      // Viewport coordinates — the floater is `position: fixed`, so we must
      // NOT add scroll offsets. Sit just past the end of the selection,
      // vertically centred on its last line.
      this.floaterStyle = {
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.right + 8}px`,
      }
      this.showButton = true
    },
    hide() {
      this.showButton = false
    },
    openMenu() {
      this.showButton = false
      this.includeCitation = false
      this.includePermalink = true
      this.copied = false
      this.dialog = true
    },
    async copyQuote() {
      await this.copy(this.formattedQuote)
      this.copied = true
      setTimeout(() => (this.copied = false), 1500)
    },
    async copyPermalink() {
      await this.copy(this.permalink)
    },
    async copy(text) {
      const ok = await writeClipboard(text)
      this.flash(ok ? this.$t('copied-to-clipboard') : this.$t('copy-failed'))
    },
    async nativeShare() {
      try {
        await navigator.share({
          title: this.item.article_title,
          text: `“${this.selectedText}” — ${this.attribution}`,
          url: this.permalink,
        })
      } catch (e) {
        /* user dismissed share sheet */
      }
    },
    flash(text) {
      this.snackbarText = text
      this.snackbar = true
    },
  },
}
</script>

<style lang="scss" scoped>
.quote-floater {
  position: fixed;
  z-index: 200;
  // top/left anchor the button at the end of the selection; pull it up so it
  // is vertically centred on that line.
  transform: translateY(-50%);
  pointer-events: auto;
  animation: quote-pop 0.12s ease-out;
}
.quote-floater ::v-deep .v-btn {
  border-radius: 0 !important;
  border: 2px solid #fff !important;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35) !important;
  font-weight: 700;
  letter-spacing: 0.03em;
}
@keyframes quote-pop {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}
.quote-block {
  border-left: 3px solid var(--v-primary-base, #2196f3);
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}
</style>
