<template>
  <ArticleContainer :item="item[0]">
    <div v-intersect="onIntersect"></div>
    }" />
    <v-expansion-panels v-model="panels" flat tile accordion hover multiple>
      <v-expansion-panel>
        <v-divider></v-divider>
        <v-expansion-panel-header color="rgb(249, 249, 249)">
          <div class="article_cat">
            {{ $t('about') }}
          </div>
        </v-expansion-panel-header>
        <v-divider></v-divider>
        <v-expansion-panel-content>
          <ArticleSummary v-if="item.length" :item="item[0]"></ArticleSummary>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-divider></v-divider>
        <v-expansion-panel-header color="rgb(249, 249, 249)">
          <div class="article_cat">
            {{ $t('article') }}
          </div>
        </v-expansion-panel-header>
        <v-divider></v-divider>
        <v-expansion-panel-content class="article-panel">
          <Article
            v-if="item.length"
            class="px-0"
            :item="item[0]"
            :title="show"
          ></Article>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-snackbar
      v-model="showNote"
      multi-line
      timeout="-1"
      outlined
      style="mt-0"
      class="note-snack"
    >
      <div class="d-flex" align="end">
        <b v-if="footnote" class="mb-2">Footnote {{ noteIndex }}</b>

        <v-btn
          small
          icon
          class="ml-auto"
          :aria-label="$t('aria.close-footnote')"
          @click="hideSnack"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <nuxt-content v-if="footnote" :document="note" />
      <div v-else class="mt-2" v-html="note"></div>
    </v-snackbar>
  </ArticleContainer>
</template>
<script>
export default {
  beforeRouteUpdate(to, from, next) {
    if (to.hash && to.hash.startsWith('#fn-')) {
      this.footnote = true
      const footnote = this.item[0]?.footnotes[+to.hash.substring(4) - 1]

      this.note = {
        body: {
          children: footnote.body.children.shift(),
          ...footnote.body,
        },
        ...footnote,
      }
      this.showNote = true
      this.noteIndex = +to.hash.substring(4)
    } else if (to.hash && to.hash.startsWith('#!bb-')) {
      this.note = this.item[0].bibliography.find(
        (item) => item.id === to.hash.substring(5)
      )[this.$store.state.articles.style]
      if (this.note) {
        this.footnote = false
        this.$nextTick(() => {
          this.showNote = true
        })

        next(from)
      }
    } else if (to.hash && to.hash.substring(1).startsWith('blfn')) {
      this.$vuetify.goTo(to.hash.replace('#blfn', '#fn'), { offset: 100 })
    } else if (to.hash && to.hash.substring(1).startsWith('blbb')) {
      this.$vuetify.goTo(to.hash.replace('#blbb', '#bb'), { offset: 100 })
    } else if (to.hash && to.hash === '#authors' && !this.panels.includes(0)) {
      this.panels.push(0)
      next()
    } else {
      next()
    }
  },
  props: {},
  async asyncData({ $content, params, payload }) {
    /*     console.log('payload: ', payload) */
    const item =
      (payload && payload.item) ||
      (await $content('articles', { deep: true })
        .where({
          slug: params.slug,
          published: true,
        })
        .fetch())

    item.issue = await $content(
      item[0]?.issue.split('/').slice(1).join('/').split('.')[0] || false // TODO shameful => fix
    ).fetch()

    return {
      item,
    }
  },
  data() {
    return {
      footnote: true,
      noteIndex: 1,
      showNote: false,
      show: false,
      tab: 0,
      note: false,
      loop: false,
      panels: this.$route.hash === '#authors' ? [0, 1] : [1],
    }
  },
  head() {
    const article = this.item[0]
    const authors =
      article?.authors &&
      article?.authors.map((author) => {
        return {
          name: 'citation_author',
          content: author.firstname + ' ' + author.lastname,
        }
      })
    const head = {
      title: article.article_title,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: article.abstract || article.article_title,
        },
        {
          hid: 'og:title',
          property: 'og:title',
          content: article.article_title,
        },
        {
          hid: 'og:description',
          property: 'og:description',
          content: article.abstract || article.article_title,
        },
        {
          hid: 'og:type',
          property: 'og:type',
          content: 'article',
        },
        {
          hid: 'og:url',
          property: 'og:url',
          content: this.$config.url + '/article/' + article.slug,
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content: article.picture
            ? this.$config.url + article.picture
            : this.$config.url + '/thumbnails/' + article.slug + '.png',
        },
        {
          hid: 'article:published_time',
          property: 'article:published_time',
          content: new Date(article.date).toISOString(),
        },
        {
          hid: 'article:author',
          property: 'article:author',
          content: article.authors
            ?.map((a) => `${a.firstname} ${a.lastname}`)
            .join(', '),
        },
        {
          hid: 'twitter:card',
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: article.article_title,
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: article.abstract || article.article_title,
        },
        {
          hid: 'twitter:image',
          name: 'twitter:image',
          content: article.picture
            ? this.$config.url + article.picture
            : this.$config.url + '/thumbnails/' + article.slug + '.png',
        },
        {
          name: 'citation_title',
          content: article.article_title,
        },
        ...authors,
        {
          name: 'citation_publication_date',
          content: new Date(article.date).toLocaleDateString('en-GB', {
            // you can use undefined as first argument
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
        },
        {
          name: 'citation_date',
          content: new Date(article.date).toLocaleDateString('en-GB', {
            // you can use undefined as first argument
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
        },
        {
          name: 'citation_journal_title',
          content: this.$config.full_name,
        },
        {
          name: 'citation_issn',
          content: this.$config.identifier.ISSN,
        },
        {
          name: 'citation_pdf_url',
          content: this.$config.url + '/pdfs/' + article.slug + '.pdf',
        },
        ...(article.DOI
          ? [
              {
                name: 'citation_doi',
                content: article.DOI,
              },
            ]
          : []),
        {
          name: 'citation_volume',
          content: article.issueIndex,
        },
        {
          name: 'citation_issue',
          content: article.issue.name_of_the_issue,
        },
        {
          name: 'citation_abstract_html_url',
          content: this.$config.url + '/articles/' + article.slug,
        },
        {
          name: 'citation_fulltext_html_url',
          content: this.$config.url + '/articles/' + article.slug,
        },
        {
          name: 'citation_language',
          content: article.language,
        },
        ...(article?.keywords?.length
          ? [
              {
                name: 'citation_keywords',
                content: article?.keywords,
              },
            ]
          : []),
        {
          name: 'citation_abstract',
          content: article.abstract,
        },
        {
          name: 'citation_publisher',
          content: 'Paris institute for Advanced Study',
        },
        {
          name: 'citation_journal_abbrev',
          content: this.$config.short_name,
        },
        {
          name: 'citation_journal_title',
          content: this.$config.full_name,
        },
        {
          name: 'citation_journal_issn',
          content: this.$config.identifier.ISSN,
        },
        {
          name: 'citation_journal_volume',
          content: article.issueIndex,
        },
        {
          name: 'citation_journal_issue',
          content: article.issue.name_of_the_issue,
        },
        {
          name: 'citation_journal_language',
          content: article.language,
        },
        ...(article?.keywords?.length
          ? [
              {
                name: 'citation_journal_keywords',
                content: article?.keywords,
              },
            ]
          : []),
        {
          name: 'citation_journal_abstract',
          content: article.abstract,
        },
        /*         ...(article.bibliography?.length
          ? [
              {
                name: 'citation_reference',
                name: 'citation_journal_reference',
                content: article.bibliography
                  .map((item) => item.title)
                  .join(', '),
              },
            ]
          : []), */
        {
          name: 'citation_journal_abbrev',
          content: this.$config.short_name,
        },
        {
          name: 'citation_journal_title',
          content: this.$config.full_name,
        },
      ],
      script: [
        {
          type: 'application/ld+json',
          json: {
            '@context': 'https://schema.org',
            '@type': 'ScholarlyArticle',
            headline: article.article_title,
            description: article.abstract,
            author: article.authors?.map((author) => ({
              '@type': 'Person',
              name: `${author.firstname} ${author.lastname}`,
              affiliation: author.institution,
            })),
            datePublished: article.date,
            publisher: {
              '@type': 'Organization',
              name: 'Paris Institute for Advanced Study',
              logo: {
                '@type': 'ImageObject',
                url: this.$config.url + '/icon.png',
              },
            },
            image: article.picture
              ? this.$config.url + article.picture
              : this.$config.url + '/thumbnails/' + article.slug + '.png',
            url: this.$config.url + '/article/' + article.slug,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': this.$config.url + '/article/' + article.slug,
            },
            isPartOf: {
              '@type': 'PublicationIssue',
              issueNumber: article.issueIndex,
              name: article.issue?.name_of_the_issue,
            },
            ...(article.DOI && { identifier: article.DOI }),
            keywords: article.keywords?.join(', '),
            inLanguage: article.language,
          },
        },
      ],
      link: [
        {
          rel: 'canonical',
          href: this.$config.url + '/article/' + article.slug,
        },
      ],
    }
    return head
  },
  computed: {},
  watch: {
    showNote(newVal) {
      if (newVal) {
        document.addEventListener('scroll', this.hideSnack)
      } else {
        document.removeEventListener('scroll', this.hideSnack)
      }
    },
  },
  destroyed() {
    window.removeEventListener('scroll', this.hideSnack)
  },
  mounted() {
    this.$store.commit('setLoading', false)
  },
  methods: {
    onIntersect(entries, observer) {
      // More information about these options
      // is located here: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
      this.show = entries[0].isIntersecting
    },
    hideSnack() {
      this.showNote = false
    },
  },
}
</script>
<style lang="scss">
@import '~vuetify/src/styles/settings/_variables';

@media #{map-get($display-breakpoints, 'xs-only')} {
  .article-panel .v-expansion-panel-content__wrap {
    padding-left: 0;
  }
}
.note-snack .v-snack__content {
  padding-right: 0;
}
.article_cat {
  text-transform: uppercase;
  font-weight: bold;
}
.article-panel .v-expansion-panel-content__wrap {
  padding-right: 0;
}
</style>
