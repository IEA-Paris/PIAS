<template>
  <v-container
    v-scroll="onScroll"
    class="transition-swing"
    :class="{ 'py-0': !$store.state.scrolled }"
    fluid
  >
    <v-row class="transition-swing">
      <v-col class="transition-swing" cols="12">
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <h1
              class="main-title transition-swing"
              :class="$store.state.scrolled ? 'mb-16 mt-8' : 'mb-8 mt-2'"
              v-html="$config.full_name_html"
            ></h1>
            <nuxt-content :document="page" />
          </v-col>
        </v-row>

        <LatestIssue
          :issue="latestIssue"
          :articles="latestIssueArticles"
        ></LatestIssue>

        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <!--  Featured articles -->
            <div class="text-h6">{{ $t('featured-articles') }}</div>
            <v-divider></v-divider>
            <v-list three-line>
              <ArticlesListItemMobile
                v-for="(article, index) in featuredArticles"
                v-bind="$attrs"
                :key="index"
                :index="index"
                :item="article"
                :scroll="$store.state.scrolled"
              ></ArticlesListItemMobile>
            </v-list>
          </v-col>
        </v-row> </v-col
    ></v-row>
  </v-container>
</template>
<script>
export default {
  props: {},
  async asyncData({ app, $content, store }) {
    const page = await $content('pages/' + app.i18n.locale + '/about').fetch()
    const latestIssue = (
      await $content('issues', { deep: true })
        .sortBy('date', 'desc')
        .limit(1)
        .fetch()
    )[0]
    const latestIssueArticles = await $content('articles', { deep: true })
      .where({ issue: { $regex: latestIssue.path }, published: true })
      .sortBy('date', 'asc')
      .limit(3)
      .fetch()
    const featuredArticles = await $content('articles', { deep: true })
      .where({ highlight: true, published: true })
      .sortBy('date', 'desc')
      .limit(3)
      .fetch()
    store.commit('setLoading', false) /* commit('setItems', {
      items: latestIssueArticles,
      total: latestIssueArticles.length,
      numberOfPages: 1,
      type: 'articles', 
    }) */
    return {
      page,
      featuredArticles,
      latestIssueArticles,
      latestIssue,
    }
  },
  data() {
    return {
      page: {},
      featuredArticles: [],
      latestIssueArticles: [],
      latestIssue: {},
    }
  },
  head() {
    return {
      title: 'Home',
      script: [
        {
          type: 'application/ld+json',
          json: {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: this.$config.full_name,
            alternateName: this.$config.name,
            url: this.$config.url,
            logo: this.$config.url + '/icon.png',
            description: this.$config.description,
            address: {
              '@type': 'PostalAddress',
              streetAddress: this.$config.address,
              addressLocality: 'Paris',
              postalCode: '75004',
              addressCountry: 'FR',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: this.$config.phone,
              email: this.$config.email,
              contactType: 'customer service',
            },
            sameAs: [
              'https://twitter.com/IEA_Paris',
              'https://www.facebook.com/InstitutdEtudesAvanceesdeParis',
              'https://www.linkedin.com/company/paris-institute-for-advanced-study',
            ],
          },
        },
        {
          type: 'application/ld+json',
          json: {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: this.$config.full_name,
            url: this.$config.url,
            description: this.$config.description,
            publisher: {
              '@type': 'Organization',
              name: 'Paris Institute for Advanced Study',
            },
            potentialAction: {
              '@type': 'SearchAction',
              target:
                this.$config.url + '/articles?search={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
        },
      ],
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$config.description,
        },
        {
          hid: 'og:title',
          property: 'og:title',
          content: `${this.$config.full_name} - Home`,
        },
        {
          hid: 'og:description',
          property: 'og:description',
          content: this.$config.description,
        },
        {
          hid: 'og:url',
          property: 'og:url',
          content: this.$config.url,
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `${this.$config.full_name} - Home`,
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: this.$config.description,
        },
      ],
      link: [
        {
          hid: 'canonical',
          rel: 'canonical',
          href: this.$config.url,
        },
      ],
    }
  },
  computed: {},
  watch: {
    '$i18n.locale': '$fetch',
  },
  mounted() {
    // Don't fetch on initial mount since asyncData already provided the data
    // Only fetch when locale changes
  },
  methods: {
    onScroll() {
      this.$store.commit('setScrolled')
    },
  },
}
</script>
<style lang="scss">
@import '~vuetify/src/styles/settings/_variables';
.main-title {
  font-family: 'Bodoni Moda';
  font-size: 3rem !important;
  font-weight: 500 !important;
  line-height: 3.5rem;
  max-width: 100%;
}
@media #{map-get($display-breakpoints, 'sm-only')} {
  .main-title {
    font-size: 2.4rem !important;
    line-height: 3rem;
  }
}
@media #{map-get($display-breakpoints, 'xs-only')} {
  .main-title {
    font-size: 2rem !important;
    line-height: 2.5rem;
  }
}
</style>
