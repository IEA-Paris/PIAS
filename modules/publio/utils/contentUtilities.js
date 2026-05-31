/* eslint-disable no-useless-escape */
/* eslint-disable prettier/prettier */
/* eslint-disable prefer-regex-literals */
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import matter from 'gray-matter'
import fsExtra from 'fs-extra'
import config from '../../../config'
import referenceRegex from './referenceRegex'
/* import { Repository, Tree, Diff } from 'nodegit' */
import slugify from './slugify'
import { formatAuthors } from './transforms'
export const _conflicts = []
// Textual in-text references (e.g. "(Bourdieu, 1980)") that could not be resolved to a
// bibliography entry during article processing, collected across all articles so they
// can be surfaced in the generated report (and, later, the CMS). Each entry records the
// article it came from and the raw reference text. See insertCitationKeys.js.
export const _missing = []

// Record an unresolved reference. `slug` is the article slug it appeared in (may be
// undefined for non-article content); `reference` is the raw matched text. De-duplicated
// per (slug, reference) so the same citation appearing in multiple passes is stored once.
export const recordMissingReference = (slug, reference) => {
  const ref = (reference || '').trim()
  if (!ref) return
  const article = slug || 'unknown'
  if (_missing.some((m) => m.article === article && m.reference === ref)) return
  _missing.push({ article, reference: ref })
}

// Soft, advisory list of institution spelling variants that were auto-merged
// into a single affiliation (same canonical key but differing original strings,
// e.g. "ETH Zurich" vs "ETH Zurich, Switzerland", or a FR/EN pair). Unlike
// `_conflicts` these never block and never drop data — they merely tell the
// editor which spelling was kept so they can harmonise it in the CMS author doc.
export const _spellingVariants = []
const recordSpellingVariant = (id, kept, variant, articles = []) => {
  if (!kept || !variant || kept === variant) return
  const existing = _spellingVariants.find(
    (v) =>
      v.kept === kept &&
      v.variant === variant &&
      JSON.stringify(v.id) === JSON.stringify(id)
  )
  if (existing) {
    existing.articles = Array.from(
      new Set([...(existing.articles || []), ...(articles || [])])
    )
    return
  }
  _spellingVariants.push({ id, kept, variant, articles: [...(articles || [])] })
}

// Soft, advisory list of institution fields that appear to hold MORE THAN ONE
// institution in a single string (a data-entry error — two affiliations joined
// by " / "). We never guess how to split them (a real name could contain a
// slash); we only flag the value so an editor fixes it at the source article.
export const _combinedInstitutions = []
const recordCombinedInstitution = (id, institution, articles = []) => {
  if (!institution) return
  const existing = _combinedInstitutions.find(
    (v) =>
      v.institution === institution &&
      JSON.stringify(v.id) === JSON.stringify(id)
  )
  if (existing) {
    existing.articles = Array.from(
      new Set([...(existing.articles || []), ...(articles || [])])
    )
    return
  }
  _combinedInstitutions.push({
    id,
    institution,
    articles: [...(articles || [])],
  })
}

// Canonical comparison key for an institution free-text string: slugify only
// (lowercase + accent-fold + punctuation). For COMPARISON/dedupe only — never
// stored. DELIBERATELY conservative: we do NOT translate languages or collapse
// prefixes, because doing so risks merging distinct affiliations and pooling
// positions that don't belong together (e.g. inventing "Director @ LSE").
// Strings that differ by more than case/accents/punctuation simply coexist.
export const canonicalInstitutionKey = (institution) =>
  institution ? slugify(String(institution)) : ''

// Drop empty/whitespace-only positions; always return an array.
export const pruneEmptyPositions = (positions) =>
  (Array.isArray(positions) ? positions : [])
    .map((p) => (typeof p === 'string' ? p.trim() : p))
    .filter((p) => p && p.length)

// Normalise an author record up front so the merge sees clean, consistent
// data: trimmed names (so the same person isn't represented as 'Saadi ' vs
// 'Saadi'), and affiliations with a non-empty trimmed institution and pruned
// positions. Applied to BOTH the per-article authors and the author documents
// loaded from disk, so pre-existing committed docs self-heal on the next run.
// Names keep their accents (significant for identity); only whitespace trimmed.
export const normalizeAuthor = (author) => {
  if (!author) return author
  return {
    ...author,
    firstname: (author.firstname || '').trim(),
    lastname: (author.lastname || '').trim(),
    positions_and_institutions: (author.positions_and_institutions || [])
      .filter((pi) => pi && String(pi.institution || '').trim())
      .map((pi) => ({
        ...pi,
        institution: String(pi.institution).trim(),
        positions: pruneEmptyPositions(pi.positions),
      })),
  }
}

/**
 * Merge two lists of { institution, positions } affiliation entries. Replaces
 * the old index-based array merge for `positions_and_institutions`, which
 * produced spurious "institution" conflicts whenever a person had different
 * (legitimate) affiliations across articles.
 *
 * Each { institution, positions } pair is treated as an ATOMIC unit: positions
 * belong to the institution they were declared with and are NEVER pooled across
 * entries (pooling fabricated affiliation/position pairs such as
 * "Director @ London School of Economics" that never existed).
 *
 * Conservative deduplication — two entries merge only when their institution
 * strings are identical after slugify (case / accents / punctuation), i.e. the
 * SAME institution written the same way. No language translation, no prefix
 * collapse: spellings that differ by more than case/accents simply coexist as
 * distinct affiliations (a person can legitimately have several). When two
 * entries share a canonical key but carry DIFFERENT positions, they are kept
 * separate — we never invent a combined position list.
 *
 * A final pruning pass removes same-language spelling duplicates (one canonical
 * key is a dash-bounded prefix of another, e.g. "London School of Economics" vs
 * "…, United Kingdom") by keeping the position-bearing / most-specific entry and
 * dropping the redundant one — but ONLY when the kept entry already covers every
 * position of the dropped one, so a position is never lost or moved. Dropped
 * spellings are recorded as soft advisories for the editor.
 *
 * Returns the merged list sorted for stable, minimal diffs. `id`/`articles` are
 * forwarded only for the advisory.
 */
export const mergeAffiliations = (
  prevList = [],
  nextList = [],
  id,
  articles = []
) => {
  // dedupeKey (canonicalKey + ' ' + sorted positions) -> entry
  const byPair = new Map()

  const add = (entry) => {
    if (!entry) return
    const original = String(entry.institution || '').trim()
    if (!original) return
    const key = canonicalInstitutionKey(original)
    if (!key) return
    // A single institution field holding two institutions joined by " / " is a
    // data-entry error; flag it for the editor but keep the value intact (we do
    // not guess the split — a real institution name could contain a slash).
    if (/\s\/\s/.test(original)) {
      recordCombinedInstitution(id, original, articles)
    }
    const positions = pruneEmptyPositions(entry.positions)
    const dedupeKey = key + ' ' + [...positions].sort().join('')

    const existing = byPair.get(dedupeKey)
    if (!existing) {
      byPair.set(dedupeKey, { key, institution: original, positions })
      return
    }
    // Same institution + same positions: a true duplicate. Keep the richer
    // (longer) original spelling and flag the variant for the editor.
    if (existing.institution !== original) {
      const kept =
        original.length > existing.institution.length
          ? original
          : existing.institution
      const dropped = kept === original ? existing.institution : original
      existing.institution = kept
      recordSpellingVariant(id, kept, dropped, articles)
    }
  }

  ;[...(prevList || []), ...(nextList || [])].forEach(add)

  const entries = Array.from(byPair.values())

  // Prune redundant duplicates while NEVER moving a position. Two entries are
  // "related" when one canonical key is a dash-bounded prefix of the other
  // (same-language spelling variants such as "london-school-of-economics" vs
  // "london-school-of-economics-united-kingdom"). Cross-language spellings have
  // unrelated keys and are left to coexist (flagged as advisories elsewhere).
  const related = (a, b) =>
    a !== b &&
    a.key &&
    b.key &&
    (a.key === b.key ||
      b.key.startsWith(a.key + '-') ||
      a.key.startsWith(b.key + '-'))

  // Drop entry E when a related entry F makes it redundant, i.e. F already
  // carries every position E has (E empty, or E.positions ⊆ F.positions) and F
  // is the "better" representative (more positions, else more specific/longer
  // key, else longer string). This removes bare-name and country-suffix
  // duplicates and keeps the position-bearing / most descriptive spelling,
  // without ever fabricating an affiliation/position pair.
  // Strict total order so that of two mutually-related entries EXACTLY one is
  // kept (otherwise both could drop each other). More positions wins; then more
  // specific (longer key); then longer string; final asymmetric tiebreak on the
  // string so the comparison is never symmetric-true.
  const better = (f, e) => {
    if (f.positions.length !== e.positions.length) {
      return f.positions.length > e.positions.length
    }
    if (f.key.length !== e.key.length) return f.key.length > e.key.length
    if (f.institution.length !== e.institution.length) {
      return f.institution.length > e.institution.length
    }
    return f.institution > e.institution
  }

  return entries
    .filter((e, _i, all) => {
      const f = all.find(
        (o) =>
          related(e, o) &&
          e.positions.every((p) => o.positions.includes(p)) &&
          better(o, e)
      )
      if (f && e.institution !== f.institution) {
        recordSpellingVariant(id, f.institution, e.institution, articles)
      }
      return !f
    })
    .sort(
      (a, b) =>
        a.key.localeCompare(b.key) || a.institution.localeCompare(b.institution)
    )
    .map(({ institution, positions }) => ({ institution, positions }))
}
const fieldsToDelete = [
  'slug',
  'body',
  'dir',
  'path',
  'extension',
  'updatedAt',
  'toc',
  'description',
  'title',
  'text',
  'checksum',
]

function processFrontmatter(md, options) {
  const frontmatter = matter(md).data
  Object.entries(options).forEach(function ([fieldName, value]) {
    if (value === 'del' || value === '-') {
      delete frontmatter[fieldName]
    } else {
      frontmatter[fieldName] = value
    }
  })

  return matter.stringify(matter(frontmatter))
}

// Build the on-disk path (relative to the submodule content root) of the
// author document for a given { firstname, lastname } id, mirroring the
// filename logic in insertDocuments so the editor can open the exact CMS file.
// Returns e.g. "content/authors/l/lahlou_saadi".
const authorDocPath = (id = {}) => {
  const fileName = slugify(
    (id.lastname || '') +
      (id.firstname && id.firstname.length ? '_' + id.firstname : '')
  )
  return 'content/authors/' + fileName[0] + '/' + fileName
}

// Decap CMS deep link into the author entry editor. For a nested collection
// (folder: content/authors) the entry route is
// /admin/#/collections/authors/entries/<path-below-the-collection-folder>,
// e.g. content/authors/s/slater-mel.md → .../entries/s/slater-mel.
// config.url is the site origin (never hardcode the domain).
const authorCmsLink = (id) => {
  const entryPath = authorDocPath(id).replace(/^content\/authors\//, '')
  return `${config.url}/admin/#/collections/authors/entries/${entryPath}`
}

const authorLabel = (id = {}) =>
  [id.firstname, id.lastname].filter(Boolean).join(' ').trim() || 'unknown'

// Turn the raw, per-merge _conflicts entries into an editor-actionable shape,
// grouped per (author, field) with deduplicated competing values and their
// source articles, plus the author doc path and a CMS deep link.
const buildConflictReport = () => {
  const byAuthorField = new Map()
  for (const { id, key, prev, next, articles = [] } of _conflicts) {
    const groupKey = JSON.stringify(id) + '::' + key
    if (!byAuthorField.has(groupKey)) {
      byAuthorField.set(groupKey, {
        author: authorLabel(id),
        field: key,
        authorDoc: authorDocPath(id) + '.md',
        cmsLink: authorCmsLink(id),
        _values: new Map(), // value -> Set(articles)
      })
    }
    const group = byAuthorField.get(groupKey)
    // `prev` is the kept/existing value; `next` is the incoming one. Provenance
    // articles are only known for the incoming value.
    if (!group._values.has(prev)) group._values.set(prev, new Set())
    if (!group._values.has(next)) group._values.set(next, new Set())
    articles.forEach((a) => group._values.get(next).add(a))
  }
  return Array.from(byAuthorField.values()).map(({ _values, ...rest }) => ({
    ...rest,
    values: Array.from(_values.entries()).map(([value, articles]) => ({
      value,
      articles: Array.from(articles),
    })),
  }))
}

// Group the soft spelling-variant advisories per author, listing the kept
// spelling and the dropped variants the editor may want to harmonise.
const buildSpellingVariantReport = () => {
  const byAuthorKept = new Map()
  for (const { id, kept, variant, articles = [] } of _spellingVariants) {
    const groupKey = JSON.stringify(id) + '::' + kept
    if (!byAuthorKept.has(groupKey)) {
      byAuthorKept.set(groupKey, {
        author: authorLabel(id),
        authorDoc: authorDocPath(id) + '.md',
        cmsLink: authorCmsLink(id),
        kept,
        _variants: new Map(), // variant -> Set(articles)
      })
    }
    const group = byAuthorKept.get(groupKey)
    if (!group._variants.has(variant)) group._variants.set(variant, new Set())
    articles.forEach((a) => group._variants.get(variant).add(a))
  }
  return Array.from(byAuthorKept.values()).map(({ _variants, ...rest }) => ({
    ...rest,
    variants: Array.from(_variants.keys()),
  }))
}

// Group the combined-institution advisories (a single institution field that
// holds two institutions joined by " / ") per author, with the offending
// value(s) and source articles, plus the CMS link to fix them at the source.
const buildCombinedInstitutionReport = () => {
  const byAuthor = new Map()
  for (const { id, institution, articles = [] } of _combinedInstitutions) {
    const groupKey = JSON.stringify(id)
    if (!byAuthor.has(groupKey)) {
      byAuthor.set(groupKey, {
        author: authorLabel(id),
        authorDoc: authorDocPath(id) + '.md',
        cmsLink: authorCmsLink(id),
        _values: new Map(), // institution -> Set(articles)
      })
    }
    const group = byAuthor.get(groupKey)
    if (!group._values.has(institution)) {
      group._values.set(institution, new Set())
    }
    articles.forEach((a) => group._values.get(institution).add(a))
  }
  return Array.from(byAuthor.values()).map(({ _values, ...rest }) => ({
    ...rest,
    institutions: Array.from(_values.entries()).map(([value, articles]) => ({
      value,
      articles: Array.from(articles),
    })),
  }))
}

export const storeReport = () => {
  const today = new Date()
  const date =
    today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
  const time =
    today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds()
  const dateTime = date + ' ' + time
  // Group the flat list of unresolved references by article slug so the report reads as
  // { slug: [ref, ref, …] } rather than a long undifferentiated array.
  const missingByArticle = _missing.reduce((acc, { article, reference }) => {
    ;(acc[article] = acc[article] || []).push(reference)
    return acc
  }, {})
  // The report is retro-committed to the submodule each CI run. Keep the
  // volatile `createdAt` out of the change-detection so an unchanged payload
  // doesn't churn a commit every run: only rewrite the file when the actual
  // conflicts/spellingVariants/missingReferences differ from the report on disk.
  const payload = {
    conflicts: buildConflictReport(),
    spellingVariants: buildSpellingVariantReport(),
    combinedInstitutions: buildCombinedInstitutionReport(),
    missingReferences: missingByArticle,
  }
  const dumpOpts = { noRefs: true, sortKeys: true }
  const body = yaml.dump(payload, dumpOpts)
  const reportPath = './generated/report.md'
  if (fs.existsSync(reportPath)) {
    const prev = fs.readFileSync(reportPath, 'utf8')
    const parsed = matter(prev)
    // Strip the timestamp before comparing; everything else is the payload.
    const { createdAt, ...prevPayload } = parsed.data || {}
    if (yaml.dump(prevPayload, dumpOpts) === body) return
  }
  return fs.writeFileSync(
    reportPath,
    `---
${yaml.dump({ createdAt: dateTime, ...payload }, dumpOpts)}
---`
  )
}
/* export const printWikipediaDisciplines = () => {
  const result = disciplines
  const replaceUl = (node) => {
    if (
      node.children &&
      node.children[0] &&
      node.children[0].tag === 'ul' &&
      node.children[0].children.length
    ) {
      console.log('REMOVED UL', node.children[0].tag === 'ul')
      node.children = [
        ...node.children[0].children,
        ...(node.children &&
        Array.isArray(node.children) &&
        node.children.length > 1
          ? node.children.shift()
          : []),
      ]
    }
    if (
      node.children &&
      node.children[0] &&
      node.children[0].tag === 'ul' &&
      node.children[0].children.length
    ) {
      replaceUl(node)
    }
    return node
  }
  const processNode = (node) => {
    try {
      // handle description
      if (node.description?.children?.length) {
        let description = `
      <p>
      `
        node.description.children.forEach((descriptionChild) => {
          if (descriptionChild.type === 'text')
            description += descriptionChild.value
          if (descriptionChild.tag === 'a')
            description += `<a href="https://en.wikipedia.org/wiki/${descriptionChild.href}" target="_blank">${descriptionChild.value}</a>`
          if (descriptionChild.tag === 'em')
            description += `<br><b>${descriptionChild?.children
              .map((i) => processNode(i))
              .join()}</b>`
        })
        node.description = description + '</p>'
      }
      replaceUl()
      if (node.outline?.length) {
        node.outline = 'https://en.wikipedia.org/wiki/' + node.outline
      }
      if (node.children) {
        node.children.forEach((child) => {
          child = processNode(child)
          /*  if () 
        })
      }
      return node
      // is it a category?
    } catch (error) {
      console.log('error: ', error)
      console.log('node.children: ', node.value)
      return node
    }
  }
  disciplines.forEach((item) => {
    processNode(item)
    item = processNode(item)
  })
  fs.writeFileSync('result.js', JSON.stringify(result))
  // start with h2 nodes
 const headers2 = 
  return content 
} */
/* export const getStagedChanges = async () => {
  const emptyTree = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
  const repo = await Repository.open(path.resolve('./.git'))

  const head = await repo.getHeadCommit()
  if (!head) {
    return []
  }
  const tree = await (head ? head.getTree() : Tree.lookup(repo, emptyTree))
  const diff = await Diff.treeToIndex(repo, tree, null)
  const patches = await diff.patches()
   console.log(patches.map((patch) => patch.newFile().path())) 
} 
async function print() {
  const repo = await Repository.open(path.resolve('./.git'))
  const diff = await Diff.indexToWorkdir(repo, null, {
    flags:
      Diff.OPTION.SHOW_UNTRACKED_CONTENT | Diff.OPTION.RECURSE_UNTRACKED_DIRS,
  })

  // you can't simple log diff here, it logs as empty object
  // console.log(diff); // -> {}

  diff.patches().then((patches) => {
    patches.forEach((patch) => {
      patch.hunks().then((hunks) => {
        hunks.forEach((hunk) => {
          hunk.lines().then((lines) => {
                    console.log('diff', patch.oldFile().path(), patch.newFile().path())
            console.log(hunk.header().trim()) 
            lines.forEach((line) => {
                    console.log(
                String.fromCharCode(line.origin()) + line.content().trim()
              ) 
            })
          })
        })
      })
    })
  })

  return diff
} */
export const filterAndMerge = (first, second) => {
  // step 1, we remove and copy from first to second all the common authors
  first = first.filter((author) => {
    // does it have a reference? (a reference is the path of the author document.
    // If present, it means that the doc in "first", author data extracted from an article,
    // explicitely referenced an author document to distinguish from potential homonyms)
    if (author.reference && author.reference.length) {
      // is it matching an existing doc?
      const referencedDocIndex = second.findIndex(
        (doc) =>
          doc.path ===
          author.reference.split('/').slice(1).join('/').split('.')[0]
      )
      if (referencedDocIndex > -1) {
        // if so we merge them and remove the related articleAuthor
        second[referencedDocIndex] = mergeDeep(
          [second[referencedDocIndex], author],
          {
            lastname: author?.lastname,
            firstname: author?.firstname,
            orcid: author?.socials?.orcid,
          }
        )
        return false
      }
    }
    return true
  })

  first = first.filter((author) => {
    if (!author.social_channels) {
      if (author?.social_channels?.orcid) {
        // does it have an orcid?
        // is it matching an existing doc?
        const referencedDocIndex = second.findIndex(
          (doc) => author.social_channels.orcid === doc.social_channels.orcid
        )
        if (referencedDocIndex > -1) {
          // if so we merge them and remove the related articleAuthor
          second[referencedDocIndex] = mergeDeep(
            [second[referencedDocIndex], author],
            {
              lastname: author?.lastname,
              firstname: author?.firstname,
              orcid: author?.socials?.orcid,
            }
          )
          return false
        }
      }
    }
    return true
  })

  first = first.filter((author) => {
    // does it have the same firstname/lastname than a doc author?
    const referencedDocIndex = second.findIndex((doc) => {
      if (doc.is_institution && author.is_institution) {
        return (
          author.lastname &&
          doc.lastname &&
          author?.lastname.trim().toLowerCase() ===
            doc?.lastname.trim().toLowerCase()
        )
      } else {
        return (
          !doc.is_institution &&
          !author.is_institution &&
          author?.firstname &&
          doc?.firstname &&
          author?.firstname.trim().toLowerCase() ===
            doc?.firstname.trim().toLowerCase() &&
          author.lastname &&
          doc?.lastname &&
          author?.lastname.trim().toLowerCase() ===
            doc?.lastname.trim().toLowerCase()
        )
      }
    })

    // if so we merge them and remove the related articleAuthor
    if (referencedDocIndex > -1) {
      second[referencedDocIndex] = mergeDeep(
        [second[referencedDocIndex], author],
        {
          lastname: author?.lastname,
          firstname: author?.firstname,
          orcid: author?.socials?.orcid,
        }
      )
      return false
    }
    return true
  })
  // remove the authors document that match no article
  /* second = second.filter((author) => !author.reference) */
  return { first, second }
}
/**
 * Performs a deep merge of objects and returns new object. Does not modify
 * objects (immutable) and merges arrays via concatenation.
 *
 */
export const mergeDeep = (objects, id) => {
  const isObject = (obj) => obj && typeof obj === 'object'
  if (!process.env.conflicts) process.env.conflicts = []
  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key]
      const oVal = obj[key]
      if (obj[key] !== undefined || prev[key] !== undefined) {
        if (prev[key] === undefined) prev[key] = oVal
        // Affiliations are merged as a SET keyed by canonical institution name,
        // NOT by array index — index-merging was the dominant source of
        // spurious "institution" conflicts. Route here even when only one side
        // has the array, so a first-seen author's list is still canonicalised
        // and deduplicated. See mergeAffiliations.
        if (
          key === 'positions_and_institutions' &&
          (Array.isArray(pVal) || Array.isArray(oVal))
        ) {
          prev[key] = mergeAffiliations(
            Array.isArray(pVal) ? pVal : [],
            Array.isArray(oVal) ? oVal : [],
            id,
            obj.articles
          )
        }
        // if we deal with an array
        else if (Array.isArray(pVal) && Array.isArray(oVal)) {
          // check its items type
          if (
            (pVal[0] && typeof pVal[0] === 'object') ||
            (oVal[0] && typeof oVal[0] === 'object')
          ) {
            // if object, recursive call
            prev[key] = mergeDeep([pVal, oVal], id)
          } else {
            // if not we concat
            const newArr = [...pVal.concat(...oVal)]
            // and deduplicate
            prev[key] = newArr.filter((value, index) => {
              const _value = JSON.stringify(value)
              return (
                index ===
                newArr.findIndex((obj) => {
                  return JSON.stringify(obj) === _value
                })
              )
            })
          }
          // if object, recursive call
        } else if (isObject(pVal) && isObject(oVal)) {
          prev[key] = mergeDeep([pVal, oVal], id)
          // if string and the base is not set
        } else if (
          typeof oVal === 'string' &&
          !prev[key].length &&
          oVal.length
        ) {
          prev[key] = oVal.trim()
        }
        // if string and both are set (conflict) // TODO decide on a conflict default strategy
        else if (
          typeof oVal === 'string' &&
          prev[key].length &&
          oVal.length &&
          prev[key].trim() !== oVal.trim()
        ) {
          prev[key] = pVal.trim() // just to cleanup the existing string from spaces
          console.log(
            `CONFLICTED INFO: ${
              prev[key]
            } VS ${oVal} in ${key} with id ${JSON.stringify(id)}`
          )
          // Record a hard conflict on a scalar field (orcid, website, …) where
          // two articles genuinely disagree. We keep only what an editor needs
          // to arbitrate in the CMS — the field, the two competing values and
          // the incoming value's source articles — not a spread of the whole
          // object. storeReport() aggregates these per (author, field).
          _conflicts.push({
            id,
            key,
            prev: prev[key].trim(),
            next: oVal.trim(),
            articles: obj.articles || [],
          })
        } else if (typeof prev[key] === 'string') prev[key] = prev[key].trim()

        // TODO handle cases where we wanna add the different values instead of replacing
      }
    })
    return prev
  }, {})
}
export const generateChecksum = (str, algorithm, encoding) => {
  return str?.length
    ? require('crypto')
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex')
    : false
}

export function cleanupString(str) {
  if (!str) {
    return ''
  }

  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace('<br>', ' ')
    .replace(/\u00A0/g, ' ')
    .trim()
}
const fieldsToDisregard = ['DOI', 'Zid']
export const deepEqual = (x, y) => {
  const keysX = Object.keys(x)
  const keysY = Object.keys(y)
  if (keysX.length !== keysY.length) {
    return false
  }
  for (const key of keysX) {
    if (fieldsToDisregard.includes(key)) {
      continue
    }
    if (typeof x[key] !== typeof y[key]) {
      return false
    }
    if (Array.isArray(x[key])) {
      if (!Array.isArray(y[key]) || x[key].length !== y[key].length) {
        return false
      }
      if (!deepEqual(x[key], y[key])) {
        return false
      }
    } else if (typeof x[key] === 'object' && x[key] !== null) {
      if (!deepEqual(x[key], y[key])) {
        return false
      }
    } else if (typeof x[key] === 'string' && typeof y[key] === 'string') {
      if (cleanupString(x[key]) !== cleanupString(y[key])) {
        return false
      }
    } else if (x[key] !== y[key]) {
      return false
    }
  }
  return true
}

export const updateArticlesDoiAndZid = (documents) => {
  documents.forEach((document) => {
    const data = fs.readFileSync(
      './submodules/' + config.name + '/content/' + document.path + '.md',
      'utf8'
    )
    const markdown = data.split('---')[2]
    const frontmatter = yaml.load(data.split('---')[1])
    if (
      (document.DOI && !frontmatter.DOI) ||
      (document.Zid && !frontmatter.Zid) ||
      (document?.links?.bucket && !frontmatter?.links?.bucket)
    ) {
      if (document.DOI && !frontmatter.DOI) frontmatter.DOI = document.DOI
      console.log('document.DOI: ', document.DOI)
      if (document.Zid && !frontmatter.Zid) frontmatter.Zid = document.Zid
      // we write the links into the documetn as new Zenodo API doesn't return all of them (bucket missing) on list
      if (document?.links?.bucket && !frontmatter?.links?.bucket) {
        frontmatter.links = { bucket: document.links.bucket }
      }
      // writeFlag is true only if the
      fs.writeFileSync(
        './submodules/' + config.name + '/content/' + document.path + '.md',
        `---
${yaml.dump(frontmatter, { noRefs: true, sortKeys: true })}
---
${markdown || ''}`
      )
    }
  })
  return documents
}
export const batchInsertArticles = (data) => {
  try {
    data.forEach((article) => {
      /*       console.log('article: ', article.article_title) */

      // start by creating the folder if it doesn't exist
      const folderPath =
        'submodules/' +
        config.name +
        '/articles/' +
        (article.issue?.length ? article.issue.slice(15, -3) : '') +
        (article.issue?.length && article.subissue?.length
          ? '/' + slugify(article.subissue)
          : '')

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
      }
      // then dump the data in a file if there is not one already
      const fileName = folderPath + '/' + slugify(article.article_title) + '.md'
      if (!fs.existsSync(fileName)) {
        fs.writeFileSync(
          fileName,
          `---
${yaml.dump(article, { noRefs: true, sortKeys: true })}
---
${
  article.yt
    ? '<Youtube yt="' +
      article.yt +
      '" caption="' +
      article.article_title +
      '" start="' +
      article.start +
      '" stop="' +
      article.stop +
      '"></Youtube>'
    : ''
}
`
        )
      } else {
        console.log('ARTICLE ALREADY EXISTS AT ', fileName)
      }
    })
  } catch (error) {
    console.log('error: ', error)
  }
}
export const insertDocuments = (data, cat, filenameFlag) => {
  // filenameFlag is used to indicate which attribute to build the path upon
  // e.g. authors =  ['lastname', 'firstname'] or media = ['article_slug', 'caption']

  // TODO diff and selectively CRUD
  // create the folder structure or delete all the previous files
  for (const folder of cat === 'articles'
    ? data.map((item) => item.issue.slice(15, -3))
    : '0123456789abcdefghijklmnopqrstuvwxyz') {
    const folderPath = path.resolve(
      'submodules/' + config.name + '/content/' + cat + '/' + folder
    )
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true })
    } else {
      fsExtra.emptyDirSync(folderPath)
    }
  }
  const findFileName = (fileName, index = 2) => {
    // file exists
    if (
      fs.existsSync(
        './submodules/' +
          config.name +
          '/content/' +
          cat +
          '/' +
          fileName[0] +
          '/' +
          fileName +
          '_' +
          index +
          '.md'
      )
    ) {
      index++
      return findFileName(fileName, index)
    } else {
      return fileName + '_' + index + '.md'
    }
  }
  // create the new ones
  data.forEach((doc, index) => {
    const filteredDoc = Object.fromEntries(
      Object.entries(doc).filter(([k]) => !fieldsToDelete.includes(k))
    )
    let fileName = slugify(
      doc[filenameFlag[0]] +
        (doc[filenameFlag[1]] && doc[filenameFlag[1]].length
          ? '_' + doc[filenameFlag[1]] || ''
          : '')
    )

    if (
      fs.existsSync(
        cat === 'articles'
          ? './submodules/' +
              config.name +
              '/content/' +
              cat +
              '/' +
              fileName +
              '.md'
          : './submodules/' +
              config.name +
              '/content/' +
              cat +
              '/' +
              fileName[0] +
              '/' +
              fileName +
              '.md'
      )
    ) {
      fileName = findFileName(fileName, 1)
    } else {
      fileName = fileName + '.md'
    }
    fs.writeFileSync(
      cat === 'articles'
        ? './submodules/' + config.name + '/content/' + cat + '/' + fileName
        : './submodules/' +
            config.name +
            '/content/' +
            cat +
            '/' +
            fileName[0] +
            '/' +
            fileName,
      `---
${yaml.dump(filteredDoc, { noRefs: true, sortKeys: true })}
---
${doc.text ? doc.text : ''}`
    )
  })
}
/* export const generateDisciplines = () => {
  // TODO make selective depending on website settings
  disciplines.forEach((area) => {})
} */
// `slug` is the article slug, forwarded so unresolved `@key` tokens can be attributed to
// their source article in the generated report (see recordMissingReference / storeReport).
export const insertReferencesInAbstract = (text, biblio, slug) => {
  const matches = text.match(referenceRegex)
  if (matches !== null) {
    const element = matches[0]
    // find the related reference
    const ref = biblio.find(
      (item) => item.id === element.toLowerCase().substring(1)
    )
    if (!ref) {
      console.log('REFERENCE NOT FOUND IN BIB FILE: ', element)
      // Collect it (with its article slug) for the generated report / CMS.
      recordMissingReference(slug, element)
    } else {
      text = insertReferencesInAbstract(
        text.replace(element, ref.citation),
        biblio,
        slug
      )
    }
    // edit the node to include the link
    return text
  }
  return text
}

// `slug` is the article slug, forwarded so unresolved `@key` tokens can be attributed to
// their source article in the generated report (see recordMissingReference / storeReport).
export const replaceReferenceInFootnote = (footnote, biblio, slug) => {
  if (!footnote.value && footnote.children.length) {
    footnote.children = footnote.children.map((footNoteChild) =>
      replaceReferenceInFootnote(footNoteChild, biblio, slug)
    )
  } else if (footnote.value) {
    const matches = footnote.value.match(referenceRegex)
    if (matches !== null) {
      for (let index = 0; index < matches.length; index++) {
        const element = matches[index]
        // find the related reference
        const ref = biblio.find(
          (item) => item.id === element.toLowerCase().substring(1)
        )
        if (!ref) {
          console.log('REFERENCE NOT FOUND IN BIB FILE: ', element)
          // Collect it (with its article slug) for the generated report / CMS.
          recordMissingReference(slug, element)
          continue
        }
        ref.link = true
        // edit the node to include the link
        footnote.value = footnote.value.replace(
          element,
          `<a id="bb-${ref.id}" href="#bb-${ref.id}" onclick="event.stopPropagation();">${ref.citation}</a>`
        )
      }
    }
  } else {
    console.log('NO FOOTNOTE VALUE')
  }
  return footnote
}
