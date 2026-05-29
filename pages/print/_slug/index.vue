<template>
  <article class="pdf-article">
    <!-- ===================== COVER PAGE ===================== -->
    <section class="pdf-cover">
      <!-- Hidden sources that seed the running header / footer via CSS
           string-set. Placed at the very start of the cover so the strings are
           defined before any body page renders, and kept inside a positioned
           container so they don't generate their own page or shift the cover. -->
      <div class="pdf-string-source" aria-hidden="true">
        <span class="pdf-running-title">{{ runningTitle }}</span>
        <span class="pdf-footer-citation">{{ footerCitation }}</span>
      </div>

      <img
        class="pdf-cover-logo"
        src="http://localhost:3000/icon.png"
        alt="Journal logo"
      />

      <h1 class="pdf-cover-title" v-html="item.article_title"></h1>

      <div class="pdf-cover-authors">
        <ArticleAuthorsString
          :authors="item.authors"
          :initials="false"
          full
          show-institution
          have-institutions-link
        />
      </div>

      <div v-if="item.DOI && item.Zid" class="pdf-cover-doi">
        <DoiBadge :doi="item.DOI" :zid="item.Zid.toString()"></DoiBadge>
      </div>

      <template v-if="item.toCite && item.toCite.apa">
        <div class="pdf-meta-label">{{ $t('to-cite') }}</div>
        <div class="pdf-cite" v-html="item.toCite.apa"></div>
      </template>

      <div class="pdf-meta-label">{{ $t('publication-date') }}</div>
      <div class="pdf-pubdate">{{ formattedDate }}</div>

      <template v-if="item.disciplines && item.disciplines.length">
        <div class="pdf-meta-label">{{ $t('fields') }}</div>
        <div class="pdf-tags">
          <span
            v-for="(discipline, i) in item.disciplines"
            :key="'disc-' + i"
            class="pdf-tag"
            >{{ discipline }}</span
          >
        </div>
      </template>

      <template v-if="item.thematics && item.thematics.length">
        <div class="pdf-meta-label">{{ $t('themes') }}</div>
        <div class="pdf-tags">
          <span
            v-for="(thematic, i) in item.thematics"
            :key="'them-' + i"
            class="pdf-tag"
            >{{ thematic }}</span
          >
        </div>
      </template>

      <template v-if="item.tag && item.tag.length">
        <div class="pdf-meta-label">{{ $t('keywords') }}</div>
        <div class="pdf-tags">
          <span
            v-for="(tag, i) in item.tag"
            :key="'tag-' + i"
            class="pdf-tag"
            >{{ tag }}</span
          >
        </div>
      </template>

      <template v-if="item.abstract && item.abstract.length">
        <div class="pdf-meta-label">{{ $t('abstract') }}</div>
        <div class="pdf-abstract-block">
          <div class="pdf-abstract">{{ item.abstract }}</div>
        </div>
      </template>
    </section>

    <!-- ===================== TABLE OF CONTENTS ===================== -->
    <!-- Filled by the TOC paged.js handler (beforeParsed). Hidden if empty. -->
    <section class="pdf-toc-block">
      <h2 class="pdf-toc-title">{{ $t('table-of-contents') }}</h2>
      <nav class="pdf-toc"></nav>
    </section>

    <!-- ===================== ARTICLE BODY ===================== -->
    <!-- .use-inline-footnotes opts this document into the inline-footnote
         relocation handler; remove the class to keep end-of-document notes. -->
    <nuxt-content :document="item" class="article-body use-inline-footnotes" />

    <!-- ===================== FOOTNOTES (fallback) ===================== -->
    <!-- Rendered as plain semantic markup. The footnote handler removes this
         block when it successfully relocates notes inline; if relocation is
         disabled or fails, this stays as the visible footnotes section. -->
    <section
      v-if="item.footnotes && item.footnotes.length"
      class="pdf-footnotes-block"
    >
      <h2 class="pdf-section-title">{{ $t('footnotes') }}</h2>
      <ol>
        <li
          v-for="(footnote, index) in item.footnotes"
          :id="'fn' + (index + 1)"
          :key="'fn-' + index"
        >
          <nuxt-content :document="footnote" />
        </li>
      </ol>
    </section>

    <!-- ===================== BIBLIOGRAPHY ===================== -->
    <section v-if="sortedBibliography.length" class="pdf-bibliography-block">
      <h2 class="pdf-section-title">{{ $t('bibliography') }}</h2>
      <ol class="pdf-bibliography-list">
        <li
          v-for="ref in sortedBibliography"
          :id="ref.id"
          :key="ref.id"
          v-html="ref[bibliographyStyle]"
        ></li>
      </ol>
    </section>
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
    return {}
  },
  head() {
    // Emit PDF metadata as <meta> tags + <title>. pagedjs-cli scrapes these
    // and writes them into the PDF Info dictionary (Title/Author/Subject/
    // Keywords/dates) and builds the outline. The generatePDF step adds a thin
    // pdf-lib top-up for fields not covered here (e.g. Producer).
    const title = this.plainTitle
    const authors = formatAuthors(this.item.authors).replace(/&nbsp;/g, ' ')
    const keywords = (this.item.tag || []).join(', ')
    const lang = this.item.language === 'French' ? 'fr' : 'en'
    return {
      htmlAttrs: { lang },
      title,
      // Override the site-wide titleTemplate ("%s - <journal>") so the PDF's
      // Info-dictionary Title (scraped from <title> by pagedjs-cli) is just the
      // clean article title.
      titleTemplate: '%s',
      meta: [
        { hid: 'author', name: 'author', content: authors },
        {
          hid: 'subject',
          name: 'subject',
          content: this.item.abstract || title,
        },
        { hid: 'keywords', name: 'keywords', content: keywords },
        {
          hid: 'description',
          name: 'description',
          content: this.item.abstract || '',
        },
      ],
    }
  },
  computed: {
    // Title with any inline HTML stripped, for <title>/running head/metadata.
    plainTitle() {
      return (this.item.article_title || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
    },
    runningTitle() {
      const t = this.plainTitle
      // Keep the running header to a single tidy line.
      return t.length > 90 ? t.slice(0, 87).trimEnd() + '…' : t
    },
    formattedDate() {
      return new Date(this.item.date).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    },
    formatedAuthors() {
      return this.item
        ? formatAuthors(this.item.authors, this.$i18n.$t, true)
        : ''
    },
    // Short citation line repeated in the page footer.
    // Author names exactly as the APA citation renders them (e.g. "Mounier, P.,
    // & Las Casas, E."), pulled from the rendered toCite.apa string: strip HTML,
    // then take everything before the "(YEAR)" that opens the citation body.
    citationAuthors() {
      const apa = this.item.toCite && this.item.toCite.apa
      if (!apa) return ''
      const plain = apa
        .replace(/<[^>]+>/g, '')
        // Decode the HTML entities citation-js emits (e.g. &#38; → &, &amp;).
        .replace(/&#38;|&amp;/g, '&')
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      const m = plain.match(/^(.*?)\s*\(\d{4}[a-z]?\)/)
      return (m ? m[1] : plain).replace(/[.\s]+$/, '')
    },
    // Copyright holder for the © notice: the author(s) for few-author papers,
    // "the authors" once there are 4+ (matches the legacy footer + keeps the
    // line short). A CC licence is granted ON TOP of copyright, so naming the
    // holder here is correct and complementary to the CC BY notice.
    copyrightHolder() {
      const authors = this.item.authors || []
      if (!authors.length) return ''
      return authors.length < 4 ? this.citationAuthors : this.$t('the-authors')
    },
    footerCitation() {
      const year = new Date(this.item.date).getFullYear()
      const issn = this.$config.identifier && this.$config.identifier.ISSN
      // Prefer the issue's full name; fall back to its title, then the slug.
      const issueName =
        (this.issue && (this.issue.name_of_the_issue || this.issue.title)) ||
        this.nameIssue
      // Volume number — same value the APA citation renders as "Vol. N".
      const volume = this.item.issueIndex || this.issueNumber
      const parts = []
      if (this.citationAuthors) parts.push(this.citationAuthors)
      if (issueName) {
        const vol = volume ? ` – Vol. ${volume}` : ''
        parts.push(
          `${issueName}${vol} – ${this.$t('article')} No.${this.articleNumber}`
        )
      }
      if (this.$config.name) parts.push(this.$config.name)
      if (issn) parts.push(`ISSN ${issn}`)
      parts.push(
        this.copyrightHolder ? `© ${year} ${this.copyrightHolder}` : `© ${year}`
      )
      parts.push('CC BY 4.0')
      return parts.join('  ·  ')
    },
    bibliographyStyle() {
      return this.$store.state.articles.style
    },
    sortedBibliography() {
      const biblio = this.item.bibliography
      if (!biblio || !Array.isArray(biblio) || !biblio.length) return []
      return biblio
        .slice()
        .sort((a, b) =>
          (a[this.bibliographyStyle] || '').localeCompare(
            b[this.bibliographyStyle] || ''
          )
        )
    },
  },
}
</script>
<style lang="scss">
/* Screen preview of the /print/<slug> route. The PDF look is driven entirely
 * by modules/publio/css/pdf-paged.css (injected by pagedjs-cli at generation
 * time); this block only makes the route legible when opened in a browser. */
.pdf-article {
  background: #fff;
  max-width: 210mm;
  margin: 0 auto;
  padding: 20mm;
  color: #1a1a1c;
  font-family: 'Tinos', Georgia, serif;
}
.pdf-string-source {
  display: none;
}
</style>
