import colors from 'vuetify/es5/util/colors'

export default {
  env: { NODE_ENV: 'dev' },
  name: 'PPIAS',
  full_name: 'Proceedings of the Paris Institute for Advanced Study', // set to false if there is none
  subtitle: 'Open source publishing platform for open science.',
  description: 'Open source publishing platform for open science.',
  splash_title: 'Open source publishing platform for open science.',
  item_sg: 'Article',
  item_pl: 'Articles',
  recaptcha: '6Lc_xuUUAAAAALwowUq0cC0wFtFnZ2NCi3UH4i1j',
  graphqlEndpoint:
    'https://mz3e6z5nlngvdls3zh3possona.appsync-api.eu-west-2.amazonaws.com/graphql',
  graphqlApiKey: 'da2-eb5bkfhsvbdz3mexfykmkwjka4',
  keywords: 'open source, open science, science, vuejs, nuxt, vuetify, vuex',
  url: 'https://paris.pias.science',
  lang: {
    default: 'en',
    locales: [
      /*       {
        code: 'fr',
        iso: 'fr-FR',
        name: 'French',
        file: 'fr.json',
        dir: 'ltr',
      }, */
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        file: 'en.json',
        dir: 'ltr',
      },
    ],
  },
  features: {
    theme: true,
    referents: true,
    publicAlerts: true,
    projectAlerts: true,
  },
  splash: {
    colour1: '#2196f3',
    colour2: '#144DDB',
    count: 3,
    dy: 0.05,
    offset: 0.5,
    opacity: 0.4,
    peak: 4,
    scale: 0.11,
    speed: 0.05,
  },
  theme: {
    loading: 'red',
    dark: false,
    themes: {
      light: {
        primary: '#2196f3',
        secondary: '#424242',
        accent: '#82B1FF',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107',
      },
      dark: {
        primary: colors.blue,
        accent: colors.grey.darken3,
        secondary: colors.grey.darken3,
        info: colors.teal.lighten1,
        warning: colors.amber.darken3,
        error: colors.deepOrange.darken3,
        success: colors.green.accent3,
      },
    },
  },
  modules: {
    sentry: {
      dsn: 'https://a329c0ed448543d098d4c1956b6bffb4@sentry.paris-ias.io/13',
    },
    ackee: {
      domain: '0406b6c9-6dfc-44de-bb13-83bc0607cb14',
      server: 'https://ackee.paris-ias.io/',
    },
    image: {
      domains: [
        'https://picsum.photos',
        // snipcart.nuxtjs.org',
        'source.unsplash.com',
      ],
    },
    deepl: {
      key: process.env.DEEPL_KEY,
    },
    fonts: {
      families: {
        'Bodoni Moda': [500, 700],
        'Open Sans': [500, 700],
      },
    },
    bibliography: {
      defaultStyle: 'APA',
    },
  },
}
