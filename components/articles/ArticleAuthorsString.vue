<template>
  <div>
    <template v-if="showInstitution">
      <div
        v-for="(author, index) in authorInformations.authors"
        :key="index"
        class="authors"
        :class="authorInformations.authors.length > 8 ? 'small' : 'large'"
        v-html="author"
      />
      <div
        v-show="authorInformations.institutions.length"
        class="institutions-group"
      >
        <template v-if="authorInformations.institutions.length > 8">
          <template
            v-for="(institution, index) in authorInformations.institutions"
          >
            <span
              :id="`institution-${index}`"
              :key="index"
              class="institutions small"
              v-html="institution + ',&nbsp;'"
          /></template>
        </template>
        <template v-else>
          <div
            v-for="(institution, index) in authorInformations.institutions"
            :id="`institution-${index}`"
            :key="index"
            class="institutions large"
            v-html="institution"
          />
        </template>
      </div>
    </template>
    <template v-else>
      <nuxt-link v-if="link" :to="link"> </nuxt-link>
      <span v-else class="authors" v-html="formatAuthorsProxy()"></span>
    </template>
  </div>
</template>
<script>
import { formatAuthors, highlight } from '~/assets/utils/transforms'
import ArticleAuthorsMixin from '~/mixins/ArticleAuthorsMixin'

export default {
  mixins: [ArticleAuthorsMixin],
  props: {
    authors: {
      required: true,
      type: Array,
    },
    full: {
      required: false,
      type: Boolean,
      default: false,
    },
    initials: {
      required: false,
      type: Boolean,
      default: true,
    },
    link: {
      required: false,
      type: Boolean,
      default: false,
    },
    showInstitution: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
  computed: {},
  mounted() {},
  methods: {
    formatAuthorsProxy() {
      return highlight(
        formatAuthors(
          this.authors,
          this.$i18n.$t,
          this.full,
          this.initials,
          this.$config.url
        ),
        this.$store.state.articles.search || ''
      )
    },
  },
}
</script>
<style lang="scss">
.authors {
  word-wrap: normal;
  line-break: normal;
  display: inline-block;
  max-width: 100%;
}
.authors.large {
  font-size: 14px;
}
.authors.small {
  font-size: 12px;
}
.institution-name {
  padding-left: 5px;
}
.institutions-group {
  margin-top: 10px;
  line-height: 0.6rem;
  .institutions.small {
    sup {
      font-style: normal;
    }
    word-wrap: normal;
    line-break: normal;
    font-size: 10px;
    font-weight: 300;
    font-style: italic;
    font-weight: 300;
    color: #202020;
  }
  .institutions.large {
    sup {
      font-style: normal;
    }
    word-wrap: normal;
    line-break: normal;
    font-size: 12px;
    font-weight: 300;
    font-style: italic;
    font-weight: 300;
    color: #202020;
  }
}
</style>
