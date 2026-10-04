# Architecture

## Content domains

The site is an author-led educational publication built with Astro and Starlight.
Its four content domains have distinct responsibilities:

- **Textbook**: living, canonical theory independent of courses and semesters.
- **Courses**: semester-specific organization, assignments, assessment and routes through materials.
- **Guides**: shared practical instructions. Archived instructions visibly state their limitations.
- **Notes**: dated author publications that may later develop into textbook material.

Never duplicate canonical textbook theory inside a course. About is an
Obsidian-editable reference document, not a separate content domain.

## Repository and routes

| Source | Public route relative to the site base |
| --- | --- |
| `src/content/docs/textbook/<topic>/index.md` | `/textbook/<topic>/` |
| `src/content/docs/guides/<topic>/index.md` | `/guides/<topic>/` |
| `src/content/docs/courses/<courseId>/<termId>/<slug>.md` | `/courses/<courseId>/<termId>/<slug>/` |
| `src/content/courses/<courseId>/<termId>.yaml` | `/courses/<courseId>/<termId>/` |
| `src/content/notes/<slug>.md` | `/notes/<slug>/` |
| `src/content/docs/about/index.md` | `/about/` |

`astro.config.mjs` defines the origin and base URL. Routes use stable semantic
slugs and trailing slashes. Custom Astro pages provide home, textbook overview,
course lists/details, Notes lists/details and 404; they use StarlightPage.
The public navigation contains Учебник, Курсы, Инструкции, Заметки, Обо мне.
The 404 page uses the actual static `404.html` canonical URL.

## Content collections

`src/content.config.ts` defines three collections:

- `docs` uses Starlight's supported `docsLoader` and `docsSchema`, extended with
  contentKind, author metadata and optional course identifiers.
- `courses` loads YAML manifests with validated course/term IDs and typed
  `reference('docs')` entries.
- `notes` loads Markdown/MDX with title, description, publication date, optional
  update date, tags and publication state.

Starlight owns document routes, draft filtering and sidebar generation.
`src/utils/textbook.ts` supplies the ordered ML/DL overview. A route-data
middleware flattens redundant single-page groups in the generated textbook sidebar.
`sidebar.order` controls chapter order independently of course modules.

## Course manifests

A manifest is a route through materials, not a storage place for textbook prose.
The path matches `courseId` and `termId`. Each semester keeps its own manifest
and course-specific documents; previous terms are not silently overwritten.

The top-level `pages` array holds organizational documents separately from
`modules`. Roles include overview, assessment, exam, schedule, policy, resources
and other. The exam role is displayed neutrally as «Аттестация» and does not
prescribe an assessment format.

Modules follow manifest order and receive positional numbers. An optional
`label` overrides the display label only. One module may link to several
textbook pages; one page may appear in several modules/courses. Resources
separate theory, assignments, guides, notebooks, slides, repositories and other roles.
External resources use explicit URL links; internal documents use collection references.

Both `pages` and `modules` may be empty. The renderer explains an empty program;
authoring does not require inventing a semester's full sequence in advance.
Unfilled organizational documents carry an information-updating warning that
can be replaced when actual course information is available.

The build resolves references through `getEntry()` and fails on missing documents,
including references in hidden modules. Published organizational pages and visible
modules cannot link to draft documents. Hidden modules may reference existing drafts.
Detailed schema and YAML examples are in [AUTHORING.md](AUTHORING.md).

## Publication and Notes

All collections publish by default. `draft: true` exposes a document only in
development. Starlight implements this for docs; custom course and Note routes/lists
share the equivalent visibility predicate. Course lifecycle `status` is independent
of publication `draft`. Hiding a manifest does not hide its separate documents.

Notes lists sort by publication date and show title, description, tags and optional
updated date. Dates are formatted in Russian with UTC calendar semantics. An empty
list has an explicit empty state. Drafts have no production pages or search entries.
The authoring example is a development-only reference page.

## Markdown and Obsidian

The vault root is `src/content/`. Ordinary content uses `.md`; only interactive
pages require `.mdx`. Authors use standard Markdown links/images, GFM, LaTeX,
footnotes and Obsidian callouts. UI/layout stays in components and styles.
`_templates/` starts new documents as drafts and sits outside collection loaders.
`sortspec.md` changes Obsidian's file-tree presentation only and is not published.
Personal `.obsidian/` settings are local.

Astro's Satteri Markdown processor uses small build-time plugins for KaTeX math,
Obsidian callouts, YouTube previews and explicit code-fence language metadata.
Starlight supplies highlighting and copy buttons. Math is static HTML plus MathML;
KaTeX CSS/fonts are bundled locally. Invalid math fails the build. Smart punctuation
is disabled to preserve authored characters.

Images normally live beside their page in `assets/` and use relative Markdown URLs.
Astro optimizes images and applies the site's base prefix. A small image service
preserves animated GIF bytes; other formats use Sharp. `public/` holds global
assets and the lightweight YouTube runtime, not a dump of content images.

## YouTube previews

`[!YOUTUBE]` callouts are transformed before generic Obsidian callouts. Static HTML
contains a lazy thumbnail, native labelled button, caption and original-video link.
URL host/ID validation and escaped captions prevent arbitrary embeds. The local
`public/scripts/youtube-preview.js` custom element is requested only on pages
with valid embeds. There is no framework hydration or global iframe API.

Click, Enter or Space creates a privacy-enhanced youtube-nocookie.com iframe inside
a 16:9 frame. The original link remains outside it for no-JS/network/player failures.
See the authoring guide for supported URLs, optional captions and fallback details.

## Theme system

`src/styles/design.css` imports the active **Research Brown** tokens and common
`themes/shared.css`. Editorial, Technical and Research remain alternative token
sets in `src/styles/themes/`. Starlight controls light/dark mode. Shared layout
and `content.css` use these tokens for reading width, typography, borders and focus.
Styling emphasizes readable articles, restrained navigation and accessible controls.

## Interactive content

Widgets live in `src/components/interactive/`; explanatory prose stays in Markdown.
Prefer static HTML and lazy hydration of the component that needs it. Provide a
non-interactive fallback and never make essential course instructions depend on JS.
Browser Python runtimes may be used deliberately for small examples; GPU training
and large datasets belong in external notebooks/services.

## Validation and delivery

`npm run validate` runs functional tests, type/content checks, the production build,
internal-link checks and output tests. Assertions protect publication, rendering,
references and navigation; they do not freeze editable material to legacy hashes.
Deterministic examples belong in `tests/fixtures/` or disposable test projects.
Generated output, browser profiles and caches are not versioned.

Astro emits `dist/` including Pagefind search. The mapping in
`migration/route-map.csv` preserves old-to-new public URL decisions for cutover
and redirect checks. A strict reader in src/utils/legacy-routes.mjs feeds the native
Astro redirects configuration. Exact equivalents and archive fallbacks are explicit
relationships; fallback routes must exist in the legacy build. CI compares the full
MkDocs HTML inventory with the map and Astro output. Output tests inspect meta refresh,
canonical URLs, base prefixes and existing destinations.

The neutral /archive/ document is outside the main navigation. Static redirect HTML
requires neither JavaScript nor a server rewrite; it does not remap old heading anchors.
Only dist/ is deployed, including the real 404.html. GitHub Actions validates PRs without
Pages access and publishes validated main builds. A separate manual workflow restores
the retained MkDocs source using the same Pages deployment mechanism.
Cutover, rollback and raw artifact checks are documented in README.
