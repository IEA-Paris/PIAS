<template>
  <article class="printpanel page pdf a4" style="background-color: white">
    <header>
      <img
        src="http://localhost:3000/icon.png"
        alt="Avatar"
        style="width: 70px; height: 70px; margin-top: 5mm"
      />
    </header>

    <table class="paging">
      <thead>
        <tr>
          <td>&nbsp;</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="page-title" v-html="item.article_title"></div>
            <div class="article-authors">
              <ArticleAuthorsString
                :authors="item.authors"
                :initials="false"
                full
                show-institution
                have-institutions-link
              />
            </div>
            <DoiBadge
              v-if="item.DOI && item.Zid"
              :doi="item.DOI"
              :zid="item.Zid.toString()"
            ></DoiBadge>

            <div v-if="item.toCite && item.toCite.apa" class="to-cite-wrapper">
              <div class="article-label mb-2">
                {{ $t('to-cite') }}
              </div>
              <div class="to-cite" v-html="item.toCite.apa"></div>
            </div>

            <div class="mb-6 publication-date-content">
              <div class="article-label mt-4 mb-2">
                {{ $t('publication-date') }}
              </div>
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
              <div class="article-label mt-4 mb-2">{{ $t('fields') }}</div>

              <div
                v-if="item.disciplines && item.disciplines.length"
                class="mb-2"
              >
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
              <div class="article-label mt-4 mb-2">{{ $t('themes') }}</div>

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
              <div class="article-label mt-4 mb-2">{{ $t('types') }}</div>

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
            <template v-if="item.tag && item.tag.length">
              <div class="article-label mt-4 mb-2">{{ $t('keywords') }}</div>

              <div class="mb-4">
                <Tag
                  v-for="(tag, index2) in item.tag"
                  :key="index2"
                  large
                  :tag="tag"
                  :class="index2 === 0 ? 'my-1 mr-1' : 'ma-1'"
                ></Tag>
              </div>
            </template>

            <div
              v-if="item.abstract && item.abstract.length"
              class="article-abstract-frame mb-4"
            >
              <div class="article-label mt-12">
                {{ $t('abstract') }}
              </div>
              <div class="article-abstract">
                {{ item.abstract }}
              </div>
            </div>

            <nuxt-content :document="item" class="article-body" />
            <div
              v-if="item.bibliography && item.bibliography.length"
              class="bibliography-panel"
            >
              <h2 id="bibliography">
                {{ $t('bibliography') }}
              </h2>
              <ArticleBibliography :item="item"></ArticleBibliography>
            </div>
            <div
              v-if="item.footnotes && item.footnotes.length"
              class="footnotes-panel"
            >
              <h2 id="footnotes" class="mt-3">
                {{ $t('footnotes') }}
              </h2>
              <ArticleFootnotes :item="item"></ArticleFootnotes>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td></td>
        </tr>
      </tfoot>
    </table>
    <footer id="footer">
      <div class="footer-content">
        <div v-if="nameIssue && item.toCite && item.toCite.apa">
          <small v-html="item.toCite.apa"></small>
          <small>
            {{ new Date(item.date).getFullYear() }}/{{ issueNumber }} -
            {{ nameIssue }} - Article No.{{ articleNumber }}.
            {{ $t('freely-available') }}
            <a
              :href="`${$config.url}/articles/${item.slug}`"
              style="text-decoration: none"
              >{{ `${$config.url}/article/${item.slug}` }}</a
            >
            - ISSN {{ $config.identifier.ISSN }}/&copy;
            {{ new Date().getFullYear() }}
            <span
              v-if="item.authors.length < 4"
              v-html="formatedAuthors"
            ></span>
            <span v-else>{{ $t('the-authors') }}</span>
          </small>
        </div>
        <div>
          <small class="print-footer-text">
            This is an open access article published under the
            <a
              href="https://creativecommons.org/licenses/by-nc/4.0/"
              style="text-decoration: none"
              >Creative Commons Attribution-NonCommercial 4.0 International
              Public License (CC BY-NC 4.0)</a
            >
          </small>
        </div>
      </div>
    </footer>
  </article>
</template>
<script>
import { formatAuthors } from '~/assets/utils/transforms'
import filtersRaw from '~/generated/filters'

export default {
  layout: 'print',
  props: {},
  async asyncData({ $content, params, payload }) {
    const item =
      (payload && payload.item) ||
      (
        await $content('articles', { deep: true })
          .where({
            slug: params.slug,
          })
          .fetch()
      )[0]

    const dirArticle = item.dir.slice(9)
    let articleNumber = 1

    if (dirArticle.length > 1) {
      articleNumber =
        (
          await $content('articles', { deep: true })
            .where({
              dir: { $contains: item.dir.split('/').pop() },
            })
            .only(['date', 'slug'])
            .fetch()
        )
          .sort((a, b) => {
            return new Date(b.date) - new Date(a.date)
          })
          .findIndex((article) => article.slug === item.slug) + 1
    }

    const nameIssue = item.issue && item.issue.slice(15, -3)
    const issue = nameIssue
      ? (
          await $content('issues', { deep: true })
            .where({
              slug: nameIssue,
            })
            .fetch()
        )[0]
      : false

    const issueNumber = nameIssue
      ? filtersRaw.articles.filters.issue.items.findIndex(
          (filteredIssue) =>
            filteredIssue.value.toLowerCase() === nameIssue.toLowerCase()
        )
      : false

    return {
      item,
      issue,
      nameIssue,
      articleNumber,
      issueNumber: issueNumber === -1 ? 1 : issueNumber + 1,
    }
  },
  data() {
    return {
      /*  item: {}, */
    }
  },
  /*   async fetch() {
    this.item = (
      await this.$content('articles', { deep: true })
        .where({
          slug: this.$route.params.slug,
        })
        .fetch()
    )[0]
    this.$store.commit('setLoading', false)
  }, */
  computed: {
    formatedAuthors() {
      return this.item
        ? formatAuthors(this.item.authors, this.$i18n.$t, true)
        : ''
    },
  },
}
</script>
<style lang="scss">
@media print {
  .page {
    page-break-after: always;
  }
  @page {
    format: A4;
    size: 210mm 297mm;
    margin: 0 0 1.5rem 0; // for page numbers
  }
  .language-text.line-numbers .v-application code {
    all: initial;
    max-width: 18cm;
  }
  .publication-date-content {
    font-size: 13px;
    border-left: 5px #2c2c2d solid;
    padding: 0 15px;
  }

  .to-cite-wrapper {
    .to-cite > .csl-bib-body > .csl-entry {
      font-size: 0.7em;
      line-height: 1.2em;
      text-align: left;
    }
    border-left: 5px #5b5b66 solid;
    padding: 0 15px;
    font-size: 0.4em;
  }

  .footer-content {
    padding: 0 2rem;
    font-size: 13px;
  }

  .page-title {
    margin-top: 0 !important;
    padding-top: 0 !important;
    font-size: 35px !important;
  }

  .index {
    display: none !important;
  }

  .nuxt-content blockquote {
    border: 0.2rem solid black !important;
    background-color: #e6e6e658;
    font-weight: 500;
    font-size: 0.8rem !important;
    line-height: 0.8rem !important;
    padding: 20px;
  }
  .nuxt-content.article-body p,
  .to-cite .csl-bib-body,
  .footnotes-panel,
  .nuxt-content.article-body ul li {
    color: #000 !important;
    font-size: 16px !important;
    margin-bottom: 15px;
    margin-top: 10px;
    line-height: 26px !important;
    text-align: justify;
    width: 100%;
    max-width: 18cm;
  }
  .nuxt-content.article-body p {
    text-align: justify;
  }
  .csl-bib-body,
  .footnotes-panel,
  .nuxt-content.article-body ul li,
  .nuxt-content.article-body ul li {
    text-align: left;
  }
  .bibliography-panel,
  .footnotes-panel {
    margin-left: -1rem !important;
    font-size: 14px !important;
    text-align: left;
    page-break-before: always;
  }
  .nuxt-content.article-body blockquote h2 {
    margin-top: 0px;
  }
  .nuxt-content.article-body h2,
  #bibliography,
  #footnotes {
    font-size: 30px !important;
    margin-bottom: 20px;
    margin-top: 40px;
    word-spacing: 2px;
    line-height: 40px !important;
  }
  #bibliography,
  #footnotes {
    margin-left: 1rem;
  }
  .nuxt-content.article-body h3 {
    font-size: 28px !important;
    line-height: 34px !important;
    margin-bottom: 20px;
    margin-top: 40px;
  }

  .nuxt-content.article-body h4 {
    font-size: 24px !important;
    font-weight: 500;
    line-height: 30px !important;
    margin-bottom: 20px;
    margin-top: 40px;
  }

  .article-authors {
    font-family: 'Open sans', sans-serif;
    padding: 1em 0;
    max-width: 16cm;
    display: inline-block;
  }
  .article-abstract-frame {
    border-left: 5px #000 solid;
    padding: 0 15px;
  }
  .article-abstract {
    font-style: italic;
    margin-top: -1rem;
    font-size: 14px;
    white-space: pre-line;
  }

  .article-label {
    text-transform: uppercase;
    font-size: 10px;
    margin-top: 2em;
    margin-bottom: 0.6em;
    color: #252525;
    letter-spacing: 0.2em;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    visibility: hidden;
  }

  .page {
    position: relative;
    overflow: hidden;
    visibility: visible;
    padding: 0 !important;
    margin: 0 !important;
    page-break-after: always;
    page-break-inside: avoid !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  table.paging {
    max-width: 38em;
    margin-left: auto;
    margin-right: auto;
  }

  table.paging tfoot td {
    height: 0.8in;
  }

  table.paging thead td {
    height: 0.8in;
    width: 100%;
  }

  header,
  footer {
    position: fixed;
  }

  footer {
    bottom: 0;
  }
}

.v-divider {
  margin: 0 1em;
}

footer {
  height: 0.9in;
}

header {
  height: 1.5in;
  position: absolute;
  top: 0;
}

header,
footer {
  width: 100%;
}

.page-number {
  display: table-footer-group;
}

.footer-divider {
  margin: 3mm 0 3mm 0;
}
.footer-content {
  line-height: 0.7rem;
}
</style>
