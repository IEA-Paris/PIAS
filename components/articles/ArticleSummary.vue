<template>
  <v-row class="transition-swing flex-row-reverse">
    <v-col
      cols="12"
      class="transition-swing"
      :class="$vuetify.breakpoint.xs ? ' pa-2' : 'pa-12'"
    >
      <DoiBadge
        v-if="item.DOI && item.Zid"
        :doi="item.DOI"
        :zid="item.Zid.toString()"
      ></DoiBadge>
      <div id="authors" class="overline mt-6">
        {{ $tc('author_s', item.authors.length) }}
      </div>
      <ArticleAuthors :item="item"></ArticleAuthors>
      <div class="overline mt-6">{{ $t('publication-date') }}</div>
      <div class="mb-6">
        {{
          new Date(item.date).toLocaleDateString('en-GB', {
            // you can use undefined as first argument
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        }}
      </div>
      <template v-if="item.disciplines && item.discipline.length">
        <div class="article-label mt-6 mb-3">{{ $t('fields') }}</div>

        <div class="mb-6">
          <Tag
            v-for="(discipline, index2) in item.disciplines"
            :key="index2"
            large
            :tag="discipline"
            :class="index2 === 0 ? 'my-1 mr-1' : 'ma-1'"
          ></Tag>
        </div>
      </template>
      <template v-if="item.thematics && item.thematic.length">
        <div class="article-label mt-6 mb-3">{{ $t('themes') }}</div>

        <div class="mb-6">
          <Tag
            v-for="(thematic, index2) in item.thematics"
            :key="index2"
            large
            :thematic="thematic"
            :class="index2 === 0 ? 'my-1 mr-1' : 'ma-1'"
          ></Tag>
        </div>
      </template>
      <template v-if="item.types && item.types.length">
        <div class="article-label mt-6 mb-3">{{ $t('types') }}</div>

        <div class="mb-6">
          <Tag
            v-for="(type, index2) in item.type"
            :key="index2"
            large
            :type="type"
            :class="index2 === 0 ? 'my-1 mr-1' : 'ma-1'"
          ></Tag>
        </div>
      </template>

      <template v-if="sortedTags && sortedTags.length">
        <div class="overline">{{ $t('keywords') }}</div>

        <div class="mb-6">
          <Tag
            v-for="(tag, index2) in sortedTags"
            :key="index2"
            small
            :tag="tag"
            :class="index2 === 0 ? 'my-1 mr-1' : 'ma-1'"
          ></Tag></div
      ></template>
      <div class="overline">{{ $t('abstract') }}</div>
      <div class="mb-6">
        <template v-if="item.abstract && item.abstract.length">
          {{ item.abstract }}
        </template>
        <template v-else>
          {{ $t('no-abstract-provided-for-this-article') }}
        </template>
      </div>
      <div class="overline">{{ $t('language') }}</div>
      <div class="mb-6">
        &nbsp;{{
          $t('this-article-is-in', {
            lang: $t(item.language.toLowerCase() || 'english'),
          })
        }}
      </div>
      <template v-if="item.issue && item.issue.length">
        <div class="overline">Issue</div>
        <v-row>
          <v-col cols="12">
            <IssuePanel :item="item.issue"></IssuePanel>
          </v-col>
        </v-row>
      </template>
    </v-col>
  </v-row>
</template>
<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {}
  },
  computed: {
    sortedTags() {
      return this.$route.query?.tags?.length
        ? this.item.tag.reduce((acc, tag) => {
            if (
              this.$route.query.tags &&
              this.$route.query.tags.includes(JSON.stringify(tag))
            ) {
              return [tag, ...acc]
            }
            return [...acc, tag]
          }, [])
        : this.item.tag
    },
  },
  mounted() {},
  methods: {},
}
</script>
<style lang="scss"></style>
