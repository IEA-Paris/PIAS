<template>
  <v-container
    class="transition-swing mb-12"
    :fluid="!$store.state.scrolled"
    :class="{ 'py-0': !$store.state.scrolled }"
  >
    <v-row
      v-bind="$attrs"
      class="transition-swing"
      :no-gutters="!$store.state.scrolled"
      justify="center"
      :class="[
        $store.state.scrolled
          ? ''
          : $vuetify.breakpoint.mobile
          ? 'mx-2'
          : 'mx-6',
      ]"
    >
      <v-col cols="12" md="12" lg="10" xl="10">
        <v-card :flat="$vuetify.breakpoint.mobile">
          <div class="d-flex">
            <v-btn tile text nuxt small exact class="py-7" @click="goBack">
              <v-icon left>mdi-chevron-left</v-icon>
              {{ $t('back') }}
            </v-btn>
            <v-spacer></v-spacer>
            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <v-btn
                  v-if="item"
                  text
                  class="py-7"
                  tile
                  v-bind="attrs"
                  nuxt
                  :href="'/issue/' + item.slug"
                  target="_blank"
                  :title="item.post_title"
                  small
                  v-on="on"
                >
                  <v-icon>mdi-open-in-new</v-icon>
                </v-btn>
              </template>
              <span>Open in a new tab</span>
            </v-tooltip>
          </div>
          <v-row justify="center">
            <v-col cols="12" sm="10" md="8" lg="7" xl="6">
              <div v-if="item">
                <div class="d-flex align-center flex-column">
                  <div class="overline">{{ $t('issue') }}</div>
                  <v-divider></v-divider>
                  <h1
                    class="page-title pb-6"
                    :class="
                      ($store.state.scrolled ? 'mb-9' : 'mb-6',
                      item.name_of_the_issue &&
                      item.name_of_the_issue.length > 80
                        ? 'smaller'
                        : '')
                    "
                    v-html="item.name_of_the_issue || item.title"
                  ></h1>
                  <h4
                    class="page-subtitle pb-3"
                    :class="
                      ($store.state.scrolled ? 'mb-9' : 'mb-6',
                      item.subtitle && item.subtitle.length > 80
                        ? 'smaller'
                        : '')
                    "
                    v-html="item.subtitle"
                  ></h4>
                  <nuxt-img
                    v-if="item.cover"
                    :src="item.cover"
                    style="max-width: 100%"
                  />
                  <div class="overline mb-6">
                    {{
                      $t('publication-date-0', [
                        new Date(item.date).toLocaleDateString('en-US', {
                          // you can use undefined as first argument
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        }),
                      ])
                    }}
                  </div>
                </div>
                <v-card-text>
                  <nuxt-content
                    v-if="item.body.children && item.body.children.length"
                    :document="item"
                    style="max-width: 650px"
                  />
                  <div v-else>
                    {{ $t('no-editorial-available-for-this-issue') }}
                  </div>
                  <template v-if="articles.length">
                    <div class="text-h5 my-6">
                      {{ $t('articles-from-this-issue') }}
                    </div>
                    <ArticlesListItemMobile
                      v-for="(article, index) in articles"
                      :key="index"
                      :index="index"
                      :item="article"
                      :scroll="$store.state.scrolled"
                    ></ArticlesListItemMobile>
                  </template>
                </v-card-text>
              </div>
              <div v-else>
                {{ $t('no-article-found-in-this-issue') }}
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row></v-container
  >
</template>
<script>
import filtersRaw from '~/assets/data/filters'

export default {
  props: {},
  async asyncData({ $content, params, payload }) {
    const item =
      (payload && payload.item) ||
      (
        await $content('issues', { deep: true })
          .where({
            slug: params.slug,
          })
          .fetch()
      )[0]

    const articles = await $content('articles', { deep: true })
      .where({
        issue: { $eq: 'content' + item.path + '.md' },
        ...filtersRaw.articles,
      })
      .sortBy('date', 'asc')
      .fetch()
    return {
      item,
      articles,
    }
  },
  data() {
    return {
      socials: [],
      item: {},
      articles: [],
    }
  },

  computed: {},
  mounted() {},
  methods: {
    goBack() {
      this.$router.go(-1)
    },
  },
}
</script>
<style lang="scss"></style>
