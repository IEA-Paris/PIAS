<template>
  <v-card class="pa-3 mt-3 ml-4" flat>
    <v-row no-gutters>
      <v-col cols="auto" class="mr-3">
        <CiteModal
          v-if="!$route.name.startsWith('print')"
          :item="item"
          icon-only
        ></CiteModal>
      </v-col>
      <v-col class="">
        <span
          class="cite-text text-caption pr-3 d-inline"
          v-html="localizedCite[styleKey]"
        ></span>
      </v-col>
      <v-col cols="auto" class="">
        <v-tooltip top>
          <template #activator="{ on }">
            <v-btn
              label
              small
              icon
              class="ml-3"
              v-on="on"
              @click="copyToClipBoard()"
            >
              <v-icon> mdi-content-copy </v-icon>
            </v-btn>
          </template>
          <span>{{ $t('misc.copyToClipboard') }}</span>
        </v-tooltip>
        <BibliographyStyleMenu small></BibliographyStyleMenu
      ></v-col>
    </v-row>
  </v-card>
</template>
<script>
import { writeClipboard, htmlToPlainText } from '~/assets/utils/clipboard'
export default {
  props: {
    toCite: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    item: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {}
  },
  computed: {
    style() {
      return this.$store.state.articles.style
    },
    // The store style ("APA") maps to the lowercase CSL template key ("apa").
    styleKey() {
      return this.style === 'APA' ? 'apa' : this.style
    },
    // Active i18n locale's rendered citations, falling back to the
    // default-locale `toCite` map.
    localizedCite() {
      const iso = this.$i18n?.localeProperties?.iso
      return (iso && this.item?.toCiteIntl?.[iso]) || this.toCite || {}
    },
  },

  mounted() {},
  methods: {
    async copyToClipBoard() {
      const text = htmlToPlainText(this.localizedCite[this.styleKey])
      if (!text) return
      await writeClipboard(text)
    },
  },
}
</script>
<style lang="scss"></style>
