/* eslint-disable prettier/prettier */
  const filters = {"years":{"type":"Select","items":[2020,2021,2022]},"language":{"type":"Select","items":["English","French"]},"issue":{"type":"Select","items":["content/issues/10-12-2021.md",[]]},"discipline":{"type":"Autocomplete","items":[]},"thematic":{"type":"Autocomplete","items":[]},"type":{"type":"Autocomplete","items":[]},"tag":{"type":"Autocomplete","items":["Big Data, Artificial Intelligence ","Consumption and Production Patterns","Firms, Markets, Finance","Public Health","Human Behaviours, Social Relations","Work, Welfare, Social protection ","History of Science, Technology and Medicine","History of Science and Medicine","Online conference","Microbes","Artificial Intelligence","Data science","Deep learning","Responsability","Algorithms","Language","Robots"]}}
  const mediaTags = {"type":"Autocomplete","items":["History of Science, Technology and Medicine","History of Science and Medicine","Online conference","Microbes","Artificial Intelligence","Data science","Deep learning","Responsability","Algorithms","Language","Robots"]}
  export default {
    articles: {
      filters,
      sort:{}
  
    },
    media: {
      filters: {... filters, tags: mediaTags},
      sort:{}
    },
    authors: {
      filters: {
      years: filters.years,
      language: filters.language
      },
      sort:{}
    }
  }