#!/usr/bin/env node
/*
 * One-off + idempotent content migration: remove spaces (and other unsafe
 * characters) from article folder names, article filenames, and issue
 * filenames in a publio content submodule, by running each path component
 * through the same slugify rules the rest of publio uses.
 *
 * Why: DecapCMS (editorial_workflow + GitHub backend) turns a nested entry's
 * path into a git branch `cms/articles/<path>`. Git refs cannot contain spaces,
 * so any article whose folder/filename contains a space fails to save with a
 * 422 "is not a valid ref name". Slugifying the paths fixes this at the source.
 *
 * What it does (all within `content/` of the chosen submodule):
 *   1. Rename `content/issues/<name>.md`  -> `content/issues/<slug>.md`.
 *   2. Rewrite every article's `issue:` front-matter field to the new path.
 *   3. Slugify every article *folder* name in place (top-level and nested),
 *      preserving the existing grouping (folders are NOT collapsed onto issues —
 *      several folders legitimately share one issue).
 *   4. Slugify every article *.md* filename.
 *
 * Folder names are slugified per path-segment; the article filename keeps its
 * leading ordering prefix because slugify preserves digits/dashes.
 *
 * Safety:
 *   - Dry-run by default. Pass `--apply` to actually move/edit files.
 *   - Uses `git mv` so history is preserved (falls back to fs.renameSync if the
 *     path isn't tracked yet). Run from a clean `main` checkout of the submodule.
 *   - Idempotent: a path already slugified is left untouched, so it is safe to
 *     run repeatedly (e.g. from a pre-build hook).
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

// --- slugify (inlined copy of modules/publio/utils/slugify.js so this script
// has no ESM import quirks; keep in sync if that file changes) ----------------
function slugify(str) {
  str = (str || '').replace(/^\s+|\s+$/g, '').trim()
  str = str.toLowerCase()
  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;'
  const to = 'aaaaeeeeiiiioooouuuunc------'
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
  }
  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace -> dash
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-|-$/g, '') // trim leading/trailing dash
  return str
}

/**
 * Run the migration. Returns a summary of what was (or would be) changed.
 *
 * @param {object}  [opts]
 * @param {boolean} [opts.apply=false]   actually move/edit files (else dry-run)
 * @param {string}  [opts.submodule='PPIAS']
 * @param {boolean} [opts.quiet=false]   suppress the per-item report
 * @returns {{ renames:number, edits:number }}
 */
export function migrateSlugifyPaths(opts = {}) {
  const APPLY = opts.apply === true
  const submodule = opts.submodule || 'PPIAS'
  const quiet = opts.quiet === true
  const ROOT = path.resolve('submodules', submodule)
  const ARTICLES = path.join(ROOT, 'content', 'articles')
  const ISSUES = path.join(ROOT, 'content', 'issues')

  if (!fs.existsSync(ARTICLES)) {
    if (!quiet) {
      console.warn(
        `[migrateSlugifyPaths] no articles dir at ${ARTICLES} — skipping`
      )
    }
    return { renames: 0, edits: 0 }
  }

  const plannedMoves = [] // { from, to }
  const plannedEdits = [] // { file, field, oldVal, newVal }

  function gitMv(from, to) {
    if (!APPLY) return
    try {
      execFileSync(
        'git',
        ['-C', ROOT, 'mv', path.relative(ROOT, from), path.relative(ROOT, to)],
        {
          stdio: 'pipe',
        }
      )
    } catch (e) {
      // Not tracked (or rename-only case-change): fall back to fs.
      fs.renameSync(from, to)
    }
  }

  // We only rename names that would break a git ref. Git refs forbid spaces and a
  // handful of other characters; underscores and uppercase are perfectly valid, so
  // (per the agreed scope) we leave those alone and touch only the real offenders.
  // Matches: whitespace or any of  ~ ^ : ? * [ \
  const GIT_REF_UNSAFE = /[\s~^:?*[\\]/
  const needsRename = (seg) => GIT_REF_UNSAFE.test(seg)

  // --- 1. issue files: build raw-basename -> slug map, rename them -------------
  const issueRename = {} // 'HCERES - PFUE 2022' -> 'hceres-pfue-2022'
  if (fs.existsSync(ISSUES)) {
    for (const f of fs.readdirSync(ISSUES)) {
      if (!f.endsWith('.md')) continue
      const base = f.slice(0, -3)
      if (!needsRename(base)) continue
      const slug = slugify(base)
      if (slug && slug !== base) {
        issueRename[base] = slug
        const from = path.join(ISSUES, f)
        const to = path.join(ISSUES, slug + '.md')
        plannedMoves.push({ from, to })
        gitMv(from, to)
      }
    }
  }

  // --- 1b. move loose articles at the ARTICLES root into an issue folder -------
  // publio expects every article to live under content/articles/<group>/. A file
  // dumped straight into content/articles/ (e.g. a flat import) is grouped into a
  // folder named after the slugified basename of its `issue:` field. We do this
  // before the issue-field rewrite / slugify passes so the moved file is then
  // processed like any other.
  {
    const slugifyIssueRef = (val) => {
      const im = (val || '').match(/^content\/issues\/(.+)\.md$/)
      return im ? slugify(im[1]) : null
    }
    for (const entry of fs.readdirSync(ARTICLES, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const file = path.join(ARTICLES, entry.name)
      const text = fs.readFileSync(file, 'utf8')
      const m = text.match(/^issue:\s*(.+?)\s*$/m)
      const issueSlug = m
        ? slugifyIssueRef(m[1].replace(/^['"]|['"]$/g, ''))
        : null
      // Without a resolvable issue we can't pick a folder; leave it at root.
      if (!issueSlug) continue
      const destDir = path.join(ARTICLES, issueSlug)
      const to = path.join(destDir, entry.name)
      if (APPLY && !fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }
      plannedMoves.push({ from: file, to })
      gitMv(file, to)
    }
  }

  // --- 2. rewrite `issue:` field in every article ------------------------------
  // We scan all article files (recursively) and update a leading-line
  // `issue: content/issues/<raw>.md` to the slugified issue path.
  function eachArticleFile(dir, cb) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) eachArticleFile(full, cb)
      else if (entry.name.endsWith('.md')) cb(full)
    }
  }

  eachArticleFile(ARTICLES, (file) => {
    const text = fs.readFileSync(file, 'utf8')
    const m = text.match(/^issue:\s*(.+?)\s*$/m)
    if (!m) return
    const val = m[1].replace(/^['"]|['"]$/g, '') // strip quotes if any
    const im = val.match(/^content\/issues\/(.+)\.md$/)
    if (!im) return
    const rawIssue = im[1]
    const newIssue = issueRename[rawIssue]
    if (!newIssue) return // issue name already clean
    const newVal = `content/issues/${newIssue}.md`
    plannedEdits.push({ file, field: 'issue', oldVal: val, newVal })
    if (APPLY) {
      const updated = text.replace(/^issue:\s*.+?\s*$/m, `issue: ${newVal}`)
      fs.writeFileSync(file, updated)
    }
  })

  // --- 3 & 4. slugify folder names (deepest-first) then article filenames -------
  // Collect all directories under ARTICLES, deepest first, so renaming a child
  // before its parent doesn't invalidate the parent's path.
  function allDirs(dir) {
    const out = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const full = path.join(dir, entry.name)
        out.push(...allDirs(full), full)
      }
    }
    return out
  }

  // First slugify FILE names within their current directory.
  function slugifyFilesIn(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue
      const base = entry.name.slice(0, -3)
      if (!needsRename(base)) continue
      const slug = slugify(base)
      if (slug && slug !== base) {
        const from = path.join(dir, entry.name)
        const to = path.join(dir, slug + '.md')
        plannedMoves.push({ from, to })
        gitMv(from, to)
      }
    }
  }

  // Walk every directory (deepest first for dirs) and slugify file names, then
  // rename the directories themselves bottom-up.
  const dirsDeepestFirst = allDirs(ARTICLES) // children come before parents
  for (const dir of [...dirsDeepestFirst, ARTICLES]) {
    if (fs.existsSync(dir)) slugifyFilesIn(dir)
  }
  for (const dir of dirsDeepestFirst) {
    if (!fs.existsSync(dir)) continue
    const name = path.basename(dir)
    if (!needsRename(name)) continue
    const slug = slugify(name)
    if (slug && slug !== name) {
      const to = path.join(path.dirname(dir), slug)
      plannedMoves.push({ from: dir, to })
      gitMv(dir, to)
    }
  }

  // --- report ----------------------------------------------------------------
  const changed = plannedMoves.length + plannedEdits.length
  // When invoked from the publio hook (quiet), stay silent unless there was
  // actually something to fix — the common case is a clean tree / instant no-op.
  if (!quiet || changed) {
    console.log(`\n[migrateSlugifyPaths] submodule=${submodule} apply=${APPLY}`)
    console.log(
      `  ${plannedMoves.length} path renames, ${plannedEdits.length} issue-field edits`
    )
  }
  if (!quiet && plannedMoves.length) {
    console.log('\n  RENAMES:')
    for (const { from, to } of plannedMoves) {
      console.log(
        `    ${path.relative(ROOT, from)}\n      -> ${path.relative(ROOT, to)}`
      )
    }
  }
  if (!quiet && plannedEdits.length) {
    console.log('\n  ISSUE-FIELD EDITS:')
    for (const { file, oldVal, newVal } of plannedEdits) {
      console.log(
        `    ${path.relative(ROOT, file)}: "${oldVal}" -> "${newVal}"`
      )
    }
  }
  if (!quiet && changed) {
    console.log(
      APPLY ? '\n  Applied.' : '\n  DRY RUN — re-run with --apply to execute.'
    )
  }
  return { renames: plannedMoves.length, edits: plannedEdits.length }
}

// --- CLI shim: `node migrateSlugifyPaths.mjs [--apply] [--submodule=NAME]` ----
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSlugifyPaths({
    apply: process.argv.includes('--apply'),
    submodule:
      process.argv.find((a) => a.startsWith('--submodule='))?.split('=')[1] ||
      'PPIAS',
  })
}
