import fs from 'fs'
import path from 'path'
import config from '../config.js'

//
const configFileContent = `local_backend:
  # when using a custom proxy server port
  url: http://192.168.0.37:3000/api/v1
# when accessing the local site from
backend:
  name: github
  repo: ${config.repo}
  branch: main
  base_url: https://85o05b11ri.execute-api.eu-west-2.amazonaws.com/
  auth_endpoint: '/dev/auth'
  cms_label_prefix: 'IEA-Paris/'
publish_mode: editorial_workflow
media_folder: 'static'
public_folder: '/'
locale: fr
site_url: ${config.url}
logo_url: ${config.url}/icon.png
show_preview_links: false
slug:
  encoding: 'ascii'
  clean_accents: true
  sanitize_replacement: '-'
i18n:
  structure: multiple_folders
  locales: [en, fr]
  default_locale: ${config.lang.default}
collections:
  - name: 'authors'
    identifier_field: lastname
    label: 'Authors'
    label_singular: 'Author'
    nested:
      depth: 2
      summary: '{{lastname}} {{firstname}}'
    folder: 'authors' # The path to the folder where the documents are stored
    create: true
    slug: '{{lastname}}-{{firstname}}'
    summary: '{{lastname}} {{firstname}}'
    fields:
      [
        {
          label: 'Is institution',
          name: 'is_institution',
          widget: 'boolean',
          default: false,
        },
        {
          label: Firstname,
          name: firstname,
          widget: string,
          default: '',
          required: false,
          hint: leave empty if is_institution is true,
        },
        {
          label: Lastname,
          name: lastname,
          widget: string,
          default: '',
          required: true,
          hint: 'used as the institution name if is_institution is toggled on',
        },
        { label: 'Picture', name: 'picture', widget: 'image', required: false },
        {
          label: 'Picture Copyright',
          name: 'picture_copyright',
          widget: 'string',
          required: false,
        },
        { label: 'Body', name: 'body', widget: 'markdown', required: false },

        {
          widget: 'list',
          default: [],
          label: 'Positions and Institutions',
          name: 'positions_and_institutions',
          summary: '{{fields.position}} {{fields.institution}}',
          hint: 'E.g. Scientific Director (position <em>facultative</em>), PARIS IAS, FRANCE (Institution mandatory)',
          required: false,
          fields:
            [
              {
                label: 'Institution',
                name: 'institution',
                widget: 'string',
                default: '',
              },
              {
                widget: 'list',
                default: [],
                label: Positions,
                name: 'positions',
                summary: '{{fields.institution}}',
                required: false,
              },
            ],
        },
        {
          widget: 'object',
          default: [],
          collapsed: true,
          label: 'Social channels',
          name: 'social_channels',
          required: false,
          fields:
            [
              {
                label: 'Website',
                name: 'website',
                widget: 'string',
                default: '',
                required: false,
              },
              {
                label: 'Wikipedia',
                name: 'wikipedia',
                widget: 'string',
                default: '',
                required: false,
              },
              {
                label: 'Orcid ID',
                name: 'orcid',
                hint: 'Add only the ORCID ID, not the URL: e.g. <strong>0000-0003-1715-2919</strong>',
                widget: 'string',
                default: '',
                required: false,
              },
              {
                label: 'Linkedin',
                name: 'linkedin',
                widget: 'string',
                default: '',
                required: false,
              },
              {
                label: 'Twitter',
                name: 'webstwitterite',
                widget: 'string',
                default: '',
                required: false,
              },
              {
                label: 'Google scholar',
                name: 'google_scholar',
                widget: 'string',
                default: '',
                required: false,
              },
              {
                label: 'ResearchGate',
                name: 'researchgate',
                widget: 'string',
                default: '',
                required: false,
              },
              {
                label: 'Mendeley',
                name: 'mendeley',
                widget: 'string',
                default: '',
                required: false,
              },
            ],
        },
      ]
  - name: 'articles' # Used in routes, e.g., /admin/collections/blog
    identifier_field: article_title
    nested:
      depth: 5
      summary: '{{title}}'
    label: 'Articles' # Used in the UI
    folder: 'articles' # The path to the folder where the documents are stored
    media_folder: '/static'
    create: true # Allow users to create new documents in this collection
    slug: '{{slug}}' # Filename template, e.g., YYYY-MM-DD-title.md
    sortable_fields: ['date', 'article_title', 'issue'] # The fields on which it should be sortable
    fields: # The fields for each document, usually in front matter
      - {
          label: 'Published',
          name: 'published',
          widget: 'boolean',
          default: false,
        }
      - {
          label: 'Title',
          required: true,
          name: 'article_title',
          widget: 'string',
          pattern:
            ['^[^]{5,200}$', 'Minimum 5 characters, maximum 200 characters'],
        }
      - {
          label: 'Publication Date',
          required: true,
          name: 'date',
          widget: 'datetime',
        }
      - {
          label: 'Type',
          name: 'type',
          widget: 'select',
          required: true,
          multiple: false,
          default: 'proceedings',
          options: ['proceedings', 'article'],
          min: 1,
        }
      - {
          label: 'Does it need a DOI?',
          name: 'needDOI',
          widget: 'boolean',
          default: false,
        }
      - {
          label: 'Authors',
          name: 'authors',
          widget: 'list',
          default: [],
          summary: '{{fields.lastname}} {{fields.firstname}}',
          fields:
            [
              {
                label: 'Is institution',
                name: 'is_institution',
                widget: 'boolean',
                required: false,
                default: false,
              },
              {
                label: Firstname,
                name: firstname,
                widget: string,
                default: '',
                required: false,
              },
              { label: Lastname, name: lastname, widget: string, default: '' },
              {
                label: 'Picture',
                name: 'picture',
                widget: 'image',
                required: false,
              },
              {
                label: 'Picture Copyright',
                name: 'picture_copyright',
                widget: 'image',
                required: false,
              },
              {
                widget: 'list',
                default: [],
                label: 'Positions and Institutions',
                name: 'positions_and_institutions',
                summary: '{{fields.position}} {{fields.institution}}',
                hint: 'E.g. Scientific Director (position <em>facultative</em>), PARIS IAS, FRANCE (Institution mandatory)',
                fields:
                  [
                    {
                      label: 'Institution',
                      name: 'institution',
                      widget: 'string',
                      default: '',
                    },
                    {
                      widget: 'list',
                      default: [],
                      label: Positions,
                      name: 'positions',
                      summary: '{{fields.institution}}',
                      required: false
                    },
                  ],
              },
              {
                widget: 'object',
                default: [],
                collapsed: true,
                label: 'Social channels',
                name: 'social_channels',
                summary: '{{fields.label}}: {{fields.value}}',
                required: false,
                fields:
                  [
                    {
                      label: 'Website',
                      name: 'website',
                      widget: 'string',
                      default: '',
                      required: false,
                    },
                    {
                      label: 'Wikipedia',
                      name: 'wikipedia',
                      widget: 'string',
                      default: '',
                      required: false,
                    },
                    {
                      label: 'Orcid ID',
                      name: 'orcid',
                      hint: 'Add only the ORCID ID, not the URL: e.g. <strong>0000-0003-1715-2919</strong>',
                      widget: 'string',
                      default: '',
                      required: false,
                    },
                    {
                      label: 'Linkedin',
                      name: 'linkedin',
                      widget: 'string',
                      default: '',
                      required: false,
                    },
                    {
                      label: 'Twitter',
                      name: 'webstwitterite',
                      widget: 'string',
                      default: '',
                      required: false,
                    },
                    {
                      label: 'Google scholar',
                      name: 'google_scholar',
                      widget: 'string',
                      default: '',
                      required: false,
                    },
                    {
                      label: 'ResearchGate',
                      name: 'researchgate',
                      widget: 'string',
                      default: '',
                      required: false,
                    },
                    {
                      label: 'Mendeley',
                      name: 'mendeley',
                      widget: 'string',
                      default: '',
                      required: false,
                    },
                  ],
              },
            ],
        }
      - {
          label: 'Custom PDF',
          name: 'custom_pdf',
          widget: 'file',
          required: false,
          allow_multiple: false,
          media_library: { allow_multiple: false, media_folder: 'pdfs' },
          hint: 'If used, the usual PDF will not be generated (and the
            file provided will be used instead)',
        }
      - {
          label: 'Abstract',
          name: 'abstract',
          widget: 'text',
          required: true,
          pattern:
            [
              '^[^]{12,2000}$',
              'Minimum 12 characters and maximum 2000 characters',
            ],
        }
      - {
          label: 'Issue',
          name: 'issue',
          widget: 'file',
          required: true,
          media_folder: '/issues',
          public_folder: 'content/issues',
        }
      - {
          label: 'Picture',
          name: 'picture',
          widget: 'image',
          required: false,
          hint:
            'Picture used as thumbnail and article splash. Not used if a youtube
            ID is provided as thumbnail below.',
        }
      - {
          label: 'Picture Copyright',
          name: 'picture_copyright',
          widget: 'string',
          required: false,
        }
      - {
          label: 'Youtube video',
          name: 'yt',
          widget: 'string',
          required: false,
          hint:
            'Add the ID of the youtube video you want it as a thumbnail &amp; article
            splash. Leave empty if you want a regular thumbnail',
        }
      - {
          label: 'Highlight',
          name: 'highlight',
          widget: 'boolean',
          hint: 'Will try to use the best slots to display highlighted articles',
          default: false,
        }
      - {
          label: 'Bibliography',
          name: 'bibliography',
          media_library:
            { allow_multiple: false, media_folder: '/bibliographies', public_folder: '/' },
          widget: 'file',
          required: false,
        }
      - {
          label: 'Language',
          name: 'language',
          widget: 'select',
          default: 'English',
          hint: 'The language of the article content (be it media or text).Fallback on english',
          options:
            [
              English,
              French,
              German,
              Italian,
              Portuguese,
              Dutch,
              Russian,
              Chinese,
              Japanese,
              Greek,
              Spanish,
              Other,
            ],
        }
      - { label: 'Article', name: 'body', widget: 'markdown', allow_multiple: false, media_folder: '/static', public_folder: '/'  }
  - name: 'issues' # Used in routes, e.g., /admin/collections/blog
    label: 'Issues' # Used in the UI
    identifier_field: title
    folder: 'issues' # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    slug: '{{name_of_the_issue}}' # Filename template, e.g., YYYY-MM-DD-title.md
    fields: # The fields for each document, usually in front matter
      - {
          label: 'Name of the issue',
          name: 'name_of_the_issue',
          widget: 'string',
          required: true,
        }
      - {
          label: 'Short name of the issue',
          name: 'title',
          widget: 'string',
          hint: Used in the issues filter and in the article component,
          required: true,
          pattern:
            ['[^]{2,32}$', 'Minimum 2 characters, maximum 32 characters'],
        }
      - { label: 'Subtitle', name: 'subtitle', widget: 'string' }
      - {
          label: 'Publication Date',
          name: 'date',
          widget: 'datetime',
          required: true,
          picker_utc: false
        }
      - { label: 'Cover', name: 'cover', widget: 'image', required: false }
      - {
          label: 'Cover Copyright',
          name: 'cover_copyright',
          widget: 'string',
          required: false,
        }
      - { label: 'Body', name: 'body', widget: 'markdown' }
  - name: 'pages' # Used in routes, e.g., /admin/collections/blog
    label: 'Pages' # Used in the UI
    i18n: true
    nested:
      depth: 2
      summary: '{{slug}}'
    folder: 'pages' # The path to the folder where the documents are stored
    create: true # Allow users to create new documents in this collection
    fields: # The fields for each document, usually in front matter
      - {
          label: 'Page title',
          i18n: true,
          name: 'page_title',
          widget: 'string',
          required: true,
          pattern:
            ['^[^]{2,150}$', 'Minimum 2 characters, maximum 150 characters'],
        }
      - { label: 'Body', i18n: true, name: 'body', widget: 'markdown' }

`
const configFilePath = path.resolve('./static/admin/config.yml')

fs.writeFile(configFilePath, configFileContent, (err) => {
  if (err) {
    console.error(err)
    return
  }
  console.log('config.yml file has been created successfully.')
})
