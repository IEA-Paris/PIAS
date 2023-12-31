<template>
  <v-card nuxt :to="localePath('/authors/' + item.slug)">
    <v-row class="mt-12" :class="{ 'mx:6': $vuetify.breakpoint.mdAndUp }">
      <v-col
        v-if="$vuetify.breakpoint.mdAndUp"
        cols="3"
        col-md-offset="1"
        justify="center"
        align="center"
        class="d-flex flex-column align-center"
      >
        <v-avatar size="160" class="mb-3">
          <OptimizedImage
            v-if="item.image"
            alt="Avatar"
            :src="item.image"
            height="160"
            :ratio="1"
          />
          <v-icon
            v-else
            class="white--text headline"
            :style="
              'background-color:' +
              $vuetify.theme.themes.light.primary +
              '; font-style: normal;'
            "
            >{{ item.firstname[0] + item.lastname[0] }}</v-icon
          >
        </v-avatar>
        <div class="flex-row justify-center">
          <v-tooltip v-if="item.wikipedia" bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                text
                v-bind="attrs"
                :href="item.wikipedia"
                target="_blank"
                v-on="on"
              >
                <v-icon>mdi-wikipedia</v-icon></v-btn
              >
            </template>
            <span>Check the Wikipedia page </span>
          </v-tooltip>
          <v-tooltip v-if="item.linkedin" bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                text
                v-bind="attrs"
                :href="item.linkedin"
                target="_blank"
                v-on="on"
              >
                <v-icon>mdi-linkedin</v-icon></v-btn
              >
            </template>
            <span>Get in touch on Linkedin</span>
          </v-tooltip>
          <v-tooltip v-if="item.twitter" bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                text
                v-bind="attrs"
                :href="item.twitter"
                target="_blank"
                v-on="on"
              >
                <v-icon>mdi-twitter</v-icon></v-btn
              >
            </template>
            <span
              >Follow this {{ mentor ? 'mentor' : 'fellow' }} on Twitter</span
            >
          </v-tooltip>
          <v-tooltip v-if="item.website" bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                icon
                text
                v-bind="attrs"
                :href="item.website"
                target="_blank"
                v-on="on"
              >
                <v-icon>mdi-link-variant</v-icon></v-btn
              >
            </template>
            <span
              >Check this {{ mentor ? 'mentor' : 'fellow' }} personal
              website</span
            >
          </v-tooltip>
        </div>
      </v-col>
      <v-col cols="12" md="8" class="mx-3">
        <div :id="slugifyItem(item.lastname)" class="anchor"></div>
        <div
          class="text-h5 font-weight-black"
          v-html="highlight(item.firstname + ' ' + item.lastname, search)"
        ></div>
        <div
          class="text-h6 mb-3"
          v-html="highlight(item.title_and_institution, search)"
        ></div>
        <div
          v-if="$vuetify.breakpoint.smAndDown"
          class="flex-row justify-center mb-6"
        >
          <v-tooltip
            v-for="social in getSocials(item)"
            :key="social.link"
            bottom
          >
            <template #activator="{ on, attrs }">
              <v-btn
                text
                icon
                color="primary"
                v-bind="attrs"
                :href="social.link"
                target="_blank"
                v-on="on"
              >
                <v-icon>{{ social.icon }}</v-icon></v-btn
              >
            </template>
            <span>{{ social.tooltip }} </span>
          </v-tooltip>
          <template v-if="podcast">
            <v-btn
              outlined
              nuxt
              :href="
                'https://www.intercontinental-academia.org/blog/' + podcast
              "
            >
              <v-icon left>mdi-play-circle</v-icon> Podcast
            </v-btn>
          </template>
        </div>
        <div class="author-exerpt">
          <nuxt-content :document="item" />
        </div>
        <small v-if="item.copyright" class="muted caption"
          >Image of &copy; {{ item.copyright }}</small
        >
      </v-col>
    </v-row>
  </v-card>
</template>
<script>
import slugify from '~/assets/utils/slugify'
export default {
  props: {
    item: {
      type: Object,
      default: () => {},
    },
    search: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      podcast: false,
    }
  },
  async fetch() {},
  computed: {},
  mounted() {},
  methods: {
    slugifyItem(item) {
      return slugify(item)
    },
    highlight: (word = '', query) => {
      const check = new RegExp(query, 'ig')
      return word.replace(check, function (matchedText, a, b) {
        return (
          '<strong style="color: darkslategray;background-color: yellow;">' +
          matchedText +
          '</strong>'
        )
      })
    },
    getSocials(item) {
      const socials = []
      if (item..socials.website)
        socials.push({
          link: item..socials.website,
          icon: 'mdi-link-variant',
          tooltip:
            'Visit this ' + (this.mentor ? 'mentor' : 'fellow') + ' website',
        })
      if (item..socials.wikipedia)
        socials.push({
          link: item..socials.wikipedia,
          icon: 'mdi-wikipedia',
          tooltip:
            'Check the Wikipedia page of the ' +
            (this.mentor ? 'mentor' : 'fellow'),
        })
      if (item..socials.linkedin)
        socials.push({
          link: item..socials.linkedin,
          icon: 'mdi-linkedin',
          tooltip: 'Get in touch on Linkedin',
        })
      if (item..socials.twitter)
        socials.push({
          link: item..socials.twitter,
          icon: 'mdi-twitter',
          tooltip:
            'Follow this ' +
            (this.mentor ? 'mentor' : 'fellow') +
            ' on Twitter',
        })
      return socials
    },
  },
}
</script>

<style scoped>
.author-exerpt {
  max-width: 650px;
  height: 80px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
div.anchor {
  display: block;
  position: relative;
  top: -100px;
  visibility: hidden;
}
</style>
