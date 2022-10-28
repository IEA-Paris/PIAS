import generateDOI from './article/generateDOI'
export default async (content, options) => {
  const { $content } = require('@nuxt/content')
  // TODO filter fields using .only(['field'])

  const articles = await $content('articles', { deep: true })
    .where({ published: true })
    .fetch()
  await generateDOI(articles, options)
}
