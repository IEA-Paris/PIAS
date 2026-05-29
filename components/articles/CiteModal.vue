<template>
  <div class="d-inline">
    <v-dialog v-model="dialog" max-width="780" scrollable :retain-focus="false">
      <template #activator="{ on: dialogStart, attrs }">
        <v-tooltip bottom>
          <template #activator="{ on: tooltip }">
            <v-btn
              :text="!iconOnly"
              :icon="iconOnly"
              class="py-7"
              tile
              v-bind="attrs"
              :aria-label="$t('aria.cite-export-article')"
              v-on="{ ...tooltip, ...dialogStart }"
            >
              <v-icon :large="!iconOnly">mdi-format-quote-close</v-icon>
            </v-btn>
          </template>
          <span>{{ $t('cite-or-export-this-article') }}</span>
        </v-tooltip>
      </template>

      <v-card>
        <v-toolbar flat dense>
          <v-toolbar-title class="text-h6">
            {{ $t('cite-or-export-this-article') }}
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

        <v-tabs v-model="tab" grow>
          <v-tab>
            <v-icon left small>mdi-format-quote-close</v-icon>
            {{ $t('cite-this-article') }}
          </v-tab>
          <v-tab>
            <v-icon left small>mdi-download</v-icon>
            {{ $t('export-this-article') }}
          </v-tab>
        </v-tabs>

        <v-divider></v-divider>

        <v-card-text class="pt-4" style="max-height: 60vh">
          <v-tabs-items v-model="tab">
            <!-- ╭───────────────────── CITE ─────────────────────╮ -->
            <v-tab-item>
              <div class="d-flex align-center mb-2">
                <span class="text-caption text--secondary">
                  {{ $t('citation-style') }}
                </span>
                <v-chip-group
                  v-model="activeStyle"
                  mandatory
                  active-class="primary--text"
                  class="ml-2"
                >
                  <v-chip
                    v-for="s in styleKeys"
                    :key="s"
                    small
                    :value="s"
                    label
                  >
                    {{ styleLabel(s) }}
                  </v-chip>
                </v-chip-group>
              </div>

              <v-sheet outlined rounded class="pa-4 d-flex align-start">
                <div
                  class="flex-grow-1 cite-rendered text-body-2"
                  v-html="renderedCitation"
                ></div>
                <v-tooltip left>
                  <template #activator="{ on, attrs }">
                    <v-btn
                      icon
                      small
                      class="ml-2"
                      v-bind="attrs"
                      :aria-label="$t('aria.copy-citation', [activeStyle])"
                      v-on="on"
                      @click="copyText(plainCitation, 'cite')"
                    >
                      <v-icon small>
                        {{
                          copied === 'cite' ? 'mdi-check' : 'mdi-content-copy'
                        }}
                      </v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('misc.copyToClipboard') }}</span>
                </v-tooltip>
              </v-sheet>

              <!-- Quick identifiers -->
              <div class="mt-5">
                <div
                  v-for="id in identifiers"
                  :key="id.key"
                  class="d-flex align-center py-1"
                >
                  <div
                    class="text-overline text--secondary"
                    style="width: 90px"
                  >
                    {{ id.label }}
                  </div>
                  <a
                    :href="id.href"
                    target="_blank"
                    rel="noopener"
                    class="flex-grow-1 text-truncate text-body-2"
                  >
                    {{ id.value }}
                  </a>
                  <v-btn
                    icon
                    x-small
                    :aria-label="$t('aria.copy-citation', [id.label])"
                    @click="copyText(id.value, id.key)"
                  >
                    <v-icon x-small>
                      {{ copied === id.key ? 'mdi-check' : 'mdi-content-copy' }}
                    </v-icon>
                  </v-btn>
                </div>
              </div>
            </v-tab-item>

            <!-- ╭──────────────────── EXPORT ────────────────────╮ -->
            <v-tab-item>
              <p class="text-caption text--secondary mb-4">
                {{ $t('export-formats-tip') }}
              </p>

              <v-list v-if="hasExports" class="py-0" two-line>
                <v-list-item
                  v-for="fmt in exportList"
                  :key="fmt.key"
                  class="px-0"
                >
                  <v-list-item-icon class="mr-3">
                    <v-icon>{{ fmt.icon }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ fmt.label }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ fmt.hint }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action class="flex-row align-center">
                    <v-tooltip bottom>
                      <template #activator="{ on, attrs }">
                        <v-btn
                          icon
                          small
                          v-bind="attrs"
                          :aria-label="$t('aria.copy-citation', [fmt.label])"
                          v-on="on"
                          @click="copyText(fmt.content, fmt.key)"
                        >
                          <v-icon small>
                            {{
                              copied === fmt.key
                                ? 'mdi-check'
                                : 'mdi-content-copy'
                            }}
                          </v-icon>
                        </v-btn>
                      </template>
                      <span>{{ $t('misc.copyToClipboard') }}</span>
                    </v-tooltip>
                    <v-tooltip bottom>
                      <template #activator="{ on, attrs }">
                        <v-btn
                          icon
                          small
                          v-bind="attrs"
                          :aria-label="$t('aria.download-format', [fmt.label])"
                          v-on="on"
                          @click="download(fmt)"
                        >
                          <v-icon small>mdi-download</v-icon>
                        </v-btn>
                      </template>
                      <span>{{ $t('download') }}</span>
                    </v-tooltip>
                  </v-list-item-action>
                </v-list-item>
              </v-list>

              <v-alert v-else type="info" text dense class="mt-2">
                {{ $t('export-not-available') }}
              </v-alert>

              <!-- Reference managers -->
              <template v-if="hasExports">
                <v-divider class="my-4"></v-divider>
                <div class="text-overline text--secondary mb-2">
                  {{ $t('reference-managers') }}
                </div>
                <div class="d-flex flex-wrap" style="gap: 8px">
                  <v-btn
                    outlined
                    small
                    @click="download(exports.ris, 'zotero')"
                  >
                    <v-icon left small>mdi-book-open-variant</v-icon>
                    {{ $t('zotero') }}
                  </v-btn>
                  <v-btn
                    outlined
                    small
                    @click="download(exports.ris, 'mendeley')"
                  >
                    <v-icon left small>mdi-book-open-variant</v-icon>
                    {{ $t('mendeley') }}
                  </v-btn>
                  <v-btn
                    outlined
                    small
                    @click="download(exports.ris, 'endnote')"
                  >
                    <v-icon left small>mdi-book-open-variant</v-icon>
                    {{ $t('endnote') }}
                  </v-btn>
                </div>
                <p class="text-caption text--secondary mt-2 mb-0">
                  {{ $t('reference-managers-tip') }}
                </p>
              </template>
            </v-tab-item>
          </v-tabs-items>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions>
          <span class="text-caption text--secondary ml-2">
            <v-icon x-small>mdi-format-quote-close</v-icon>
            {{ $t('inline-quote-tips') }}
          </span>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="dialog = false">
            {{ $t('close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" timeout="2000" bottom>
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script>
import config from '~/config'
import { writeClipboard, htmlToPlainText } from '~/assets/utils/clipboard'

// Static descriptors for the export formats. Keyed to match the
// `article.exports` map produced at build time by
// modules/publio/lib/article/files/generateBibliographyFilesForExport.js
const EXPORT_DESCRIPTORS = [
  { key: 'bibtex', icon: 'mdi-language-latex', hint: 'BibTeX / LaTeX (.bib)' },
  {
    key: 'ris',
    icon: 'mdi-book-open-variant',
    hint: 'RIS — EndNote, Zotero, Mendeley (.ris)',
  },
  { key: 'csl', icon: 'mdi-code-json', hint: 'CSL-JSON (.json)' },
  { key: 'tei', icon: 'mdi-xml', hint: 'XML-TEI biblStruct (.xml)' },
  { key: 'dublinCore', icon: 'mdi-xml', hint: 'Dublin Core / OAI-DC (.xml)' },
  { key: 'dcTerms', icon: 'mdi-xml', hint: 'DCMI Terms (.xml)' },
  { key: 'datacite', icon: 'mdi-xml', hint: 'DataCite kernel-4 (.xml)' },
]

export default {
  props: {
    item: {
      required: true,
      type: Object,
    },
    // Render as a bare icon button (used inside the cite widget) vs. the
    // large toolbar button.
    iconOnly: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dialog: false,
      tab: 0,
      // Default to the first build-time citation style (keys are lowercase
      // CSL template names, e.g. "apa", "harvard1").
      activeStyle: Object.keys(this.item.toCite || {})[0] || 'apa',
      copied: null,
      snackbar: false,
      snackbarText: '',
    }
  },
  computed: {
    exports() {
      return this.item.exports || {}
    },
    hasExports() {
      return Object.keys(this.exports).length > 0
    },
    exportList() {
      return EXPORT_DESCRIPTORS.filter((d) => this.exports[d.key]).map((d) => ({
        ...d,
        label: this.exports[d.key].label,
        content: this.exports[d.key].content,
        filename: this.exports[d.key].filename,
        mime: this.exports[d.key].mime,
      }))
    },
    // Available rendered citation styles (from build-time `toCite`).
    styleKeys() {
      const keys = Object.keys(this.item.toCite || {})
      return keys.length ? keys : ['apa']
    },
    // Active i18n locale's rendered citations (date formatting + connector
    // words), falling back to the default-locale `toCite` map.
    localizedCite() {
      const iso = this.$i18n?.localeProperties?.iso
      return (iso && this.item.toCiteIntl?.[iso]) || this.item.toCite || {}
    },
    renderedCitation() {
      const map = this.localizedCite
      return (
        map[this.activeStyle] || map[this.styleKeys[0]] || this.fallbackCitation
      )
    },
    plainCitation() {
      return htmlToPlainText(this.renderedCitation)
    },
    // Fallback when build-time citations are missing.
    fallbackCitation() {
      const authors = (this.item.authors || [])
        .map((a) => `${a.lastname} ${a.firstname}`)
        .join(', ')
      const year = new Date(this.item.date).getFullYear()
      return `${authors} (${year}). ${this.item.article_title}. ${this.journalName}.`
    },
    journalName() {
      return config.full_name || config.name || 'PIAS'
    },
    articleUrl() {
      // Prefer the canonical URL baked into the export metadata.
      const fromCsl =
        this.exports.csl && this.safeParse(this.exports.csl.content)?.[0]?.URL
      if (fromCsl) return fromCsl
      if (typeof window !== 'undefined') return window.location.href
      return `https://pias.science/article/${this.item.slug}`
    },
    doi() {
      return this.item.DOI || this.item.doi || ''
    },
    identifiers() {
      const ids = []
      if (this.doi) {
        ids.push({
          key: 'doi',
          label: 'DOI',
          value: this.doi,
          href: `https://doi.org/${this.doi}`,
        })
      }
      ids.push({
        key: 'url',
        label: this.$t('permalink'),
        value: this.articleUrl,
        href: this.articleUrl,
      })
      return ids
    },
  },
  methods: {
    safeParse(str) {
      try {
        return JSON.parse(str)
      } catch (e) {
        return null
      }
    },
    // Clean display name for a CSL template key (e.g. "apa" -> "APA",
    // "harvard1" -> "Harvard"). Falls back to a translation, then the key.
    styleLabel(key) {
      const known = { apa: 'APA', vancouver: 'Vancouver', harvard1: 'Harvard' }
      if (known[key]) return known[key]
      const t = this.$t(key)
      return t && t !== key ? t : key.toUpperCase()
    },
    async copyText(text, key) {
      const value = (text || '').toString()
      if (!value) {
        this.flash(this.$t('copy-failed'))
        return
      }
      const ok = await writeClipboard(value)
      if (ok) {
        this.copied = key
        this.flash(this.$t('copied-to-clipboard'))
        setTimeout(() => {
          if (this.copied === key) this.copied = null
        }, 1500)
      } else {
        this.flash(this.$t('copy-failed'))
      }
    },
    download(fmt, label) {
      if (!fmt) return
      const blob = new Blob([fmt.content], {
        type: `${fmt.mime};charset=utf-8`,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fmt.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      this.flash(this.$t('downloaded', [label ? this.$t(label) : fmt.label]))
    },
    flash(text) {
      this.snackbarText = text
      this.snackbar = true
    },
  },
}
</script>

<style lang="scss" scoped>
.cite-rendered ::v-deep a {
  word-break: break-word;
}
</style>
