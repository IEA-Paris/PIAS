<template>
  <v-footer app dark color="black" style="position: relative">
    <v-container>
      <v-row justify="center" no-gutters>
        <v-col cols="12" lg="10" class="mt-6">
          <!--    <nuxt-link :to="localePath('/')" style="transition: all 500ms ease 0s" @click.native="$vuetify.goTo(0)">
            <v-img src="/logo_text_alt.svg" contain width="200" class="my-6"></v-img>
          </nuxt-link> -->
          <v-row justify="center">
            <v-col
              cols="12"
              sm="4"
              :order="$vuetify.breakpoint.smAndDown ? 'last' : ''"
            >
              <div class="text-body-2 my-6">
                <v-icon left>mdi-map-marker</v-icon>
                {{ $config.address }}
                <br />
                <v-icon left>mdi-phone</v-icon>
                {{ $config.phone }}
                <br />
                <v-icon left>mdi-email</v-icon>
                <a :mailto="$config.email">{{ $config.email }}</a>
              </div>
              <iframe
                title="openstreetmap"
                width="100%"
                absolute
                frameborder="0"
                scrolling="no"
                marginheight="0"
                marginwidth="0"
                :src="$config.location.origin"
                style="border: 1px solid black"
                @click="$router.go($config.location.target)"
                @keyup.enter="$router.go($config.location.target)"
              ></iframe>
              <br />
              <small
                ><a href="">View Larger Map {{ $route.name }}</a></small
              >
            </v-col>
            <v-col cols="12" sm="4">
              <v-list flat color="transparent" dense>
                <v-list-item
                  :to="localePath('/')"
                  nuxt
                  @click="$route.name === 'index' ? $vuetify.goTo(0) : () => {}"
                >
                  <v-list-item-content>
                    <v-list-item-title
                      class="text-uppercase text-button"
                      v-text="$t('about-us')"
                    ></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  :to="localePath('/contact')"
                  nuxt
                  @click="open = false"
                >
                  <v-list-item-content>
                    <v-list-item-title
                      class="text-uppercase text-button"
                      v-text="$t('contact')"
                    ></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  :to="localePath('/pressroom')"
                  nuxt
                  @click="open = false"
                >
                  <v-list-item-content>
                    <v-list-item-title
                      class="text-uppercase text-button"
                      v-text="$t('pressroom')"
                    ></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  :to="localePath('/support')"
                  nuxt
                  @click="open = false"
                >
                  <v-list-item-content>
                    <v-list-item-title
                      class="text-uppercase text-button"
                      v-text="$t('support')"
                    ></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>
            <v-col
              cols="12"
              sm="4"
              :order="$vuetify.breakpoint.smAndDown ? 'first' : ''"
            >
              <div class="overline">
                {{ $t('subscribe-to-our-newsletter') }}
              </div>

              <a
                target="_blank"
                href="https://www.paris-iea.fr/en/presentation-of-the-institute/newsletter"
                class="d-flex"
              >
                <v-text-field
                  v-model="email"
                  :rules="[rules.email]"
                  :label="$t('email')"
                  outlined
                  filled
                  dense
                  large
                  height="44"
                >
                  <v-btn outlined large>{{ $t('subscribe') }}</v-btn>
                </v-text-field>
              </a>
            </v-col>
          </v-row>
          <v-row justify="center" no-gutters class="mt-3">
            <v-col cols="12" align="center">
              <v-tooltip v-for="(item, index) in social" :key="index" top>
                <template #activator="{ on }">
                  <v-btn
                    target="_blank"
                    rel="noopener noreferrer"
                    :href="item.url"
                    fab
                    dark
                    outlined
                    color="grey"
                    class="mx-3"
                    small
                    v-on="on"
                  >
                    <v-icon color="white">mdi-{{ item.icon }}</v-icon>
                  </v-btn>
                </template>
                <span>{{ item.text }}</span>
              </v-tooltip>
            </v-col>
            <v-col cols="12" align="center" class="mt-3">
              <v-btn text x-small nuxt dark>{{
                $config.identifier.ISSN
                  ? 'Online ISSN ' + $config.identifier.ISSN
                  : ''
              }}</v-btn>
              <v-btn text x-small nuxt dark>
                <!-- TODO add raw licence file url on github -->
                &copy; {{ new Date().getFullYear() }}
                {{ $t('paris-ias') }}</v-btn
              >
              <v-btn
                text
                x-small
                nuxt
                dark
                :to="localePath('/terms_of_service')"
              >
                {{ $t('tos') }}
              </v-btn>
              <v-btn text x-small nuxt dark :to="localePath('/privacy_policy')">
                {{ $t('privacy') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>
<script>
import social from '~/assets/social'
import sitemap from '~/assets/sitemap'
export default {
  props: {},
  data() {
    return {
      social,
      panel: [],
      footer: sitemap.footer,
      email: '',
      rules: {
        required: (value) => !!value || 'Required.',
        counter: (value) => value.length <= 20 || 'Max 20 characters',
        email: (value) => {
          const pattern =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          return pattern.test(value) || this.$t('invalid-e-mail')
        },
      },
    }
  },
  computed: {},
  mounted() {},
  methods: {},
}
</script>
<style lang="scss"></style>
