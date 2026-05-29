# Publio PDF rewrite — Puppeteer `page.pdf()` → paged.js

> **STATUS: IMPLEMENTED & smoke-tested (2026-05-29).** Cover, TOC with page
> numbers, real bottom-of-page footnotes, bibliography, running header/footer
> and PDF metadata all verified on a 22-page article. See "What was built" below.

## What was built (delta from the original plan)
- **Engine:** `generatePDF.js` rewritten around `pagedjs-cli`'s `Printer` API.
  Converted to pure ESM (was mixed `require`/`export`) so the standalone script
  can import it. Passes `--no-sandbox` via `browserArgs`. Keeps the dist/+static/
  dual-write and the `(route,url,meta)` signature untouched.
- **pdf-lib top-up gotcha:** must `PDFDocument.load(bytes, { updateMetadata:
  false })` — otherwise pdf-lib stamps `Producer="pdf-lib"`/ModDate at *load*
  time and clobbers our Producer. (`updateMetadata` is a load option, not a save
  option.)
- **outlineTags must be an ARRAY** (`['h1','h2','h3']`) — the CLI does
  `tags.join(',')`. A string crashes outline parsing.
- **Print page** `pages/print/_slug/index.vue`: cover + TOC placeholder + body +
  footnotes + bibliography; plain semantic markup (no Vuetify list components);
  `<meta>` tags + `titleTemplate:'%s'` override for clean PDF metadata; hidden
  string-set sources moved *inside* the cover so they don't spawn a blank page.
- **`pdf-paged.css`**: @page (A4) + named `cover` page + margin boxes (running
  title via string-set, "p. X / Y" footer, footnote area), real CSS footnotes
  (`float: footnote`), TOC dotted leaders + `target-counter` page numbers,
  consolidated typography. Palette: black/grey/white + primary blue `#2196f3`.
- **`pagedHandlers/pagedHandlers.js`** (injected via `additionalScripts`):
  TOC builder, inline-footnote relocator (with end-of-doc fallback), long-URL
  wrapper. **Sanitizes heading ids** (e.g. `1-foundations` → `pdf-h-N`) because
  `#1-foundations` is an invalid selector that crashed paged.js's
  target-counter.
- **`scripts/generatePDF.mjs`** + `yarn pdf <slug> [slug2…]`. Serves `dist/` via
  node-static, or set `PDF_BASE_URL` to render from a running dev server.
- **`makePrintRoutes.js`**: `keep` now honors `PUBLIO_KEEP_PRINT=1` (so the
  print HTML survives a build for `yarn pdf` to consume).
- **`puppeteer` bumped 19 → ^20.9** (pagedjs-cli's required line); thumbnail
  flow's puppeteer APIs verified working on 20.9.
- **i18n:** added `table-of-contents` key (en: "Contents", fr: "Sommaire").

### Content-type tests (2026-05-29, against dev server)
Generated & visually reviewed; all render well:
- **Images** (`4_Saura_2`, 5 figures; `10_Lahlou`): full-column width, scaled,
  captions kept with figure, never overflow (`break-inside: avoid` + `max-width`).
- **YouTube** (`justice-and-climate-transitions_5_table-ronde`, `MOSCO_2016_03…`):
  the existing `Youtube.vue` already renders, in print mode, the `hqdefault.jpg`
  poster wrapped in an `<a href="youtube.com/watch?v=…">` — poster→link works in
  the PDF (the 56.25% aspect-ratio box does NOT collapse under paged.js).
- **Many authors** (18 and **62** — `…collective-intelligence…`): names wrap with
  superscript affiliation numbers, affiliations list compactly; when front matter
  exceeds one page it flows to page 2 (graceful, not clipped).

### Abstract on cover — final policy (per user)
- Cover is a **flowing** page. A `coverFitHandler` (word-count → font-size model,
  10pt default down to a **7pt floor**) shrinks long abstracts so they stay on
  page 1. Calibrated from measured A4 covers (≤360 words fit at 10pt; ~460 need
  ~9pt); extra author/affiliation lines and tag groups lower the thresholds.
- **Measured answer to "longest abstract on page 1":** with a light author block,
  ~360 words at the default 10pt; up to ~600–650 words fit by shrinking toward
  7pt. The single corpus outlier (`7_Ogien`, 469 words) shrinks to ~9pt and still
  spills ~9 lines to page 2 — **accepted**: legibility over a hard one-page rule.
  (Can't pinpoint-fit it because paged.js exposes no reliable pre-pagination
  height to measure; the model is a deterministic estimate, not exact.)
- Abstract is **left-aligned** (was justify+pre-line, which stretched the line
  before each hard break into rivers). Body paragraphs got `text-align-last:left`.

### Cover & footer refinements (2026-05-29, round 2)
- **Abstract label** now sits flush-left above its text like TO CITE /
  PUBLICATION DATE (only the value carries the accent rule + indent). The
  abstract is left-aligned (not justified).
- **Footer** line now reads: `<toCite authors> · <year>/<issueNum> – <full
  issue name> – Vol. <n> – Article No.<n> · ISSN … · © <year> · CC BY-NC 4.0`.
  - Authors taken from `toCite.apa` (HTML stripped, numeric entities like
    `&#38;` decoded, text before "(YEAR)").
  - Issue name uses `issue.name_of_the_issue` (full), falling back to title/slug.
  - Volume = `item.issueIndex` (same value the APA citation shows as "Vol. N";
    it is in pruneContentDatabase's keep-list so it survives to the print page).
- **Creator metadata** is set explicitly (otherwise pagedjs-cli leaves it as the
  headless Chromium user-agent string) to:
  `Antoine Cordelois, Paris Institute for Advanced study, using Nuxt, Publio and
  Paged.js, for <config.publisher>`. Built in makePrintRoutes.js (and mirrored in
  scripts/generatePDF.mjs), passed via `route.meta.creator`, applied by pdf-lib.

### Known/observed
- Performance is excellent for article-length docs: ~167ms (8pp) / ~385ms (22pp)
  pagination; ~2s wall-clock per PDF including browser launch.
- The `/print/<slug>/graph` thumbnail route currently 500s in offline dev due to
  a **pre-existing** `TextFingerprint.vue` data bug (unrelated to this work; the
  files are untouched). Worth a separate look but does not affect PDF generation.
- Inline CSS footnotes worked cleanly on the test article; per the plan, watch
  long/boundary-crossing notes and oversized tables on real content. Remove the
  `use-inline-footnotes` class on the body to fall back to end-of-doc notes.

---

## Goal
Replace the current raw-Chromium PDF generation with **paged.js** (CSS Paged Media
polyfill) to get professional, W3C‑paginated PDFs: a fancy named cover page with a
full abstract, clean running headers/footers, real bottom‑of‑page footnotes, a
generated table of contents with page numbers, controlled page breaks, cleaned‑up
typography, and rich metadata + PDF outline/bookmarks.

## Decisions (locked with user)
- **Browser:** keep one shared headless Chromium. Puppeteer stays. Thumbnails are
  unchanged (they screenshot a Vue/D3 SVG — Sharp only post‑compresses; it cannot
  replace the browser). No slim‑Chromium swap for now.
- **PDF engine:** `pagedjs-cli` **Printer API** (programmatic). It bundles
  Puppeteer 21 + pdf‑lib + outline/bookmark + trim‑box logic — it *is* the pipeline
  we'd otherwise hand‑build.
- **Footnotes:** attempt **real CSS footnotes** (`float: footnote` + `@footnote`),
  with the existing end‑of‑document footnotes section kept as a styled fallback.

---

## Key findings / corrections
1. **Puppeteer cannot be fully removed.** It's used in `generatePDF.js` *and*
   `generateThumbnails.js`; the latter renders a Vue+D3 `<svg>` in the browser and
   screenshots it — Sharp only compresses that screenshot. Removing the browser
   would require a separate headless‑D3 rewrite (out of scope; flagged as a possible
   future workstream).
2. **`pagedjs-cli` already sets PDF metadata** (Title/Author/Subject/Keywords/dates
   from `<meta>`/`<title>`) **and builds the outline/bookmarks** from heading tags,
   **and** sets trim boxes when `bleed` is used. So our hand‑written pdf‑lib pass
   becomes mostly redundant; we keep a thin pdf‑lib pass only for fields the CLI
   doesn't map (e.g. exact CreationDate from frontmatter, Producer string).
3. **"W3C compliant" = spec‑compliant *pagination*** (correct `@page`, margin boxes,
   counters, fragmentation). It is **not** PDF/A or PDF/UA (archival/accessible).
   Those are separate ISO standards neither paged.js nor pdf‑lib produce; reaching
   them would need Ghostscript/veraPDF post‑processing (out of scope, flagged).
4. **Footnotes are paged.js's most fragile feature** — must be stress‑tested on long,
   page‑boundary‑crossing notes. Fallback path kept.
5. **Performance:** paged.js lays out the whole doc in a live DOM before printing —
   slower/heavier than `page.pdf()`. For 20–50 page articles: seconds to low tens of
   seconds. Acceptable, but set generous timeouts.
6. **Versions:** `pagedjs-cli` stable `0.4.3`; active `0.5.0-beta`/`1.0.0-alpha`.
   Pins Puppeteer `^21.9`. We'll pin a known‑good version and verify against our
   Node 20 / Nuxt 2 build.

---

## Showstoppers / risks to watch
- **MathJax timing.** paged.js must run *after* MathJax finishes typesetting, else
  equation boxes size wrong and breaks misplace. Mitigation: a `PagedConfig.before`
  hook that awaits MathJax's `typesetPromise()` (or, on the static export, ensure
  formulas are already rendered to SVG before paged.js runs). **Verify on a
  formula‑heavy article.**
- **Oversized tables / wide code / tall images.** `break-inside: avoid` only helps
  if the element fits a page; bigger elements split awkwardly or overflow. Mitigation:
  `max-height`/scaling on images, `thead { display: table-header-group }` to repeat
  table headers, wrap `<pre>`. **Verify on the worst‑case article.**
- **Footnotes reliability** (see above) — primary risk for this journal.
- **Vue/SPA timing.** Must paginate only after Nuxt has rendered. The static export
  (`nuxt generate`) pre‑renders `/print/<slug>`, so this is low‑risk; the Printer
  forces `auto:false` and waits for network idle anyway.
- **Puppeteer version coexistence.** The repo currently has `puppeteer ^19`;
  `pagedjs-cli` wants `^21`. Need to confirm a single Puppeteer version satisfies
  both the thumbnail flow and the CLI (likely bump to 21 and re‑test thumbnails).

---

## Implementation plan

### 0. Dependencies
- Add `pagedjs-cli` (pin a tested version). Reconcile the Puppeteer version with the
  thumbnail flow (likely bump `puppeteer` to the line `pagedjs-cli` expects, then
  re‑test `generateThumbnails.js`). Keep `pdf-lib` (thin post‑pass).

### 1. Rewrite the print page — `pages/print/_slug/index.vue`
Restructure the template into clearly‑marked, paged.js‑friendly sections:
- **`.cover` (named page `cover`)** — fancy front page: journal logo/wordmark,
  full title, authors+affiliations, DOI badge, "to cite", publication date,
  disciplines/themes/types/keywords tags, and the **full abstract** (no truncation,
  `break-after: page` so the body starts on a fresh page).
- **TOC placeholder** — empty `<nav class="toc">`, populated by a handler (step 3).
- **`.article-body`** — the `nuxt-content` body.
- **Footnotes** — restructure inline note markers into `float: footnote` spans for
  native bottom‑of‑page notes; keep the end section behind a feature flag/fallback.
- **Bibliography** — its own section, `break-before: page`.
- Remove the old `<table class="paging">`/`<header>`/`<footer position:fixed>`
  hacks — running heads/footers move entirely into CSS `@page` margin boxes.
- Emit metadata as `<meta name="author|subject|keywords|...">` + `<title>` (via Nuxt
  `head()`) so `pagedjs-cli` picks them up automatically.

### 2. New print stylesheet — `modules/publio/css/pdf-paged.css` (replaces `pdf.css` for print)
- `@page { size: A4; margin: …; }` with `@page :first`/named `@page cover` for the
  cover (no header/footer on cover), `@page :left`/`:right` for verso/recto margins.
- **Margin boxes:** `@bottom-center`/`@bottom-right` → `counter(page) " of "
  counter(pages)`; `@top-center` → running head via `string-set` (article short
  title) and/or `position: running()` element for journal + issue line. Reproduce the
  current footer content (citation, ISSN, CC‑BY‑NC, year) as margin‑box content.
- **`@footnote`** area styling (`float: bottom`, separator border) +
  `::footnote-call`/`::footnote-marker`.
- **TOC leaders + page numbers:** `content: leader('.') target-counter(attr(href),
  page)` (with a flexbox fallback for dotted leaders, since paged.js `leader()` is
  imperfect).
- **Typography pass:** consolidate the scattered `!important` print rules from
  `index.vue` `<style>` into clean type scale (headings, body, justification,
  widows/orphans, `break-after: avoid` on headings, `break-inside: avoid` on
  figures/tables/blockquotes).

### 3. paged.js handler(s) — `modules/publio/lib/article/files/pagedHandlers/`
Injected via the Printer's `additionalScripts`:
- **`tocHandler.js`** — `beforeParsed`: collect `h2/h3` from the body, build the
  `<nav class="toc">` entries (`<a href="#id">`), so CSS fills page numbers via
  `target-counter`.
- **`mathjaxReady.js` / `PagedConfig.before`** (if needed) — await MathJax before
  pagination.
- (Optional) link‑cleaning handler to expand/wrap long URLs.

### 4. Rewrite `modules/publio/lib/article/files/generatePDF.js`
- Replace the Puppeteer `launch → goto → page.pdf → pdf-lib` body with the
  **`pagedjs-cli` `Printer`**:
  ```js
  import Printer from 'pagedjs-cli'
  const printer = new Printer({
    allowLocal: true, allowRemote: true,
    additionalScripts: [tocHandlerPath, /* … */],
    styles: [pagedCssPath],
    timeout: 0,
  })
  const bytes = await printer.pdf(`${url}${route.route}`, { outlineTags: 'h2,h3' })
  ```
- Keep the **two‑target write logic** exactly as today (`dist/pdfs/` for same‑run S3
  deploy + `static/pdfs/` for retro‑push & Zenodo) — that's load‑bearing and stays.
- Keep a **thin pdf‑lib pass** only for fields the CLI doesn't set from `<meta>`
  (precise `CreationDate` from `route.meta.creationDate`, `Producer`, `Language`).
- Preserve the `keep`/prod index‑file cleanup and error handling.
- Keep the function signature `(route, url, meta)` and return shape so
  `files/index.js` and the Nuxt hooks in `index.js` are untouched.

### 5. Test script in `package.json` (requested)
Add a standalone script to generate the PDF for a slug or list of slugs **without a
full `nuxt generate`**, for fast iteration:
- New file `scripts/generatePDF.mjs`:
  - args: `node scripts/generatePDF.mjs <slug> [slug2 …]`
  - serves the existing `dist/` (or spins the static server like `files/index.js`
    does) — or points the Printer at a `file://` of `dist/print/<slug>/index.html`
    if already generated; otherwise documents the prerequisite (`yarn generate` once).
  - calls the new `generatePDF` for each slug, writes to `static/pdfs/<slug>.pdf`,
    prints timing.
- `package.json` script:
  ```json
  "pdf": "node scripts/generatePDF.mjs"
  ```
  Usage: `yarn pdf 1-0-1_Mounier` or `yarn pdf 1-0-1_Mounier 10_Lahlou`.
  (Exact serving strategy — reuse running dev server vs. spin node‑static on dist —
  finalized during implementation; will mirror `files/index.js` so it works offline.)

### 6. Cleanup
- Retire `css/pdf.css` print rules superseded by `pdf-paged.css` (keep the file or
  fold in). Remove dead `footerTemplate`/`displayHeaderFooter` and the
  `table.paging`/fixed `header`/`footer` scaffolding from the print page.

---

## Validation checklist (before cutover)
- [ ] Cover page renders with full (long) abstract, no clipping.
- [ ] Running header + "page X of Y" footer on every non‑cover page; none on cover.
- [ ] TOC lists sections with correct page numbers.
- [ ] Footnotes land at the bottom of the right page; long notes don't break the
      layout (else fall back to end‑section).
- [ ] MathJax formulas paginate correctly (formula‑heavy article).
- [ ] Worst‑case article (big tables / wide code / large images) doesn't overflow.
- [ ] PDF metadata (title/author/subject/keywords/dates) + outline/bookmarks present.
- [ ] `yarn pdf <slug>` produces a PDF in seconds for a single article.
- [ ] Full `nuxt generate` still writes to both `dist/pdfs/` and `static/pdfs/`.
- [ ] Thumbnail generation still works after any Puppeteer version bump.

## Out of scope (flagged for later)
- PDF/A or PDF/UA (accessible/archival) conformance — needs Ghostscript/veraPDF.
- Fully browserless pipeline (headless‑D3 thumbnails) to drop Chromium entirely.
