# Authoring guide

## Core rule

Educational content must be comfortable to edit in Obsidian and portable outside the website.

Use plain Markdown unless a page genuinely needs interactivity.

## Allowed in ordinary `.md`

- headings;
- paragraphs;
- lists;
- tables;
- fenced code blocks;
- LaTeX math;
- standard Markdown links;
- standard Markdown images;
- footnotes;
- Obsidian-style callouts.

Example:

```md
# Линейная регрессия

Функция потерь:

$$
L = \frac{1}{N}\sum_{i=1}^{N}(y_i-\hat y_i)^2.
$$

> [!NOTE]
> Это замечание нормально читается и в Obsidian, и на сайте.

![Геометрическая интерпретация](./assets/least-squares-geometry.svg)
```

## Working example

See [the Markdown demonstration](src/content/docs/guides/authoring-example/index.md)
and its page-local `assets/` directory. After `npm run dev`, open
<http://localhost:4321/ml-dl-course-site/guides/authoring-example/>.

Starlight pages require a `title` in YAML frontmatter. The site uses it as the
page's H1; start sections in the body at `##` to avoid repeating the title.
Use the appropriate `contentKind`, for example `guide` for reusable instructions.
Headings, tables, lists, footnotes (`[^name]`), code, and images all work in `.md`.
For syntax highlighting, name the language after the opening code fence, such as
`python`, `bash`, or `yaml`. Code is displayed, not executed.

## Math

Use `$a^2 + b^2 = c^2$` for inline math. For a display equation, put `$$` on
separate lines, with blank lines before and after the block:

```md
$$
\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i.
$$
```

Use `\$` for a literal dollar sign in prose. Math delimiters inside inline code
or fenced code stay literal. The supported commands are the
[KaTeX subset of LaTeX](https://katex.org/docs/supported.html), not a full TeX
installation. Invalid/unknown commands fail validation or the build instead of
silently publishing an unrendered formula. Custom global macros and automatic
equation numbering are not configured.

## Obsidian callouts

The marker must start the first line of a blockquote. An optional title follows
it, separated by a space; without a title, a Russian default is used.

```md
> [!NOTE] Свой **заголовок**
> Здесь работают ссылки, списки и $n = 3$.
>
> - Первый пункт.
> - Второй пункт.

> [!TIP]- Дополнительное пояснение
> Изначально свёрнутый блок.
```

`[!TIP]+` starts expanded and can be collapsed; `[!TIP]-` starts collapsed.
Without a suffix, a callout is always visible. Collapsible callouts use native
`details`/`summary`, including keyboard operation, without extra JavaScript.
Nested callouts use nested blockquotes (`> > [!NOTE]`). Formatting in the title
and Markdown in the body are preserved.

Callout names are case-insensitive. Supported types and aliases:

| Appearance | Types |
| --- | --- |
| Note | `note`, `abstract`, `summary`, `tldr`, `info`, `todo`, `example` |
| Tip / success | `tip`, `hint`, `important`, `success`, `check`, `done` |
| Caution / question | `warning`, `caution`, `attention`, `question`, `help`, `faq` |
| Danger / error | `danger`, `error`, `bug`, `failure`, `fail`, `missing` |
| Quotation | `quote`, `cite` |

Unknown types use the note appearance and their type name as the default title.
Ordinary blockquotes are unchanged. Write `> \[!NOTE]` to display the marker
literally in a quotation, or place the whole example in a fenced code block.
Obsidian-specific custom icons, colors, and CSS snippets are not imported.

## YouTube previews

Use an ordinary Obsidian callout in a Markdown document or note:

```md
> [!YOUTUBE]
> https://www.youtube.com/watch?v=M7lc1UVf-VE
```

Supported links are HTTPS `youtube.com/watch?v=…` (including `www` and
`m` hosts) and `youtu.be/…`. Copy the URL as-is; no manual ID extraction
is needed. A standard Markdown link in the block also works, using its href.
For an optional caption, write `> [!YOUTUBE] Название видео` or give a
Markdown link a human-readable label. Captions are rendered as text.
No title lookup, API key, oEmbed request or external metadata dependency is used.
Without a caption, the label is «Видео на YouTube». Sharing query parameters
remain on the original-video link; start-time/playlist parameters do not change
the embedded player's starting position. Only one URL belongs in each block.
Invalid URLs or blocks with additional prose remain ordinary callouts.

The preview requests a lazy thumbnail and a local JavaScript module only on
pages containing a valid embed. It loads no player iframe or YouTube iframe API
before interaction. Click, Enter or Space on the native play button replaces
the poster with a 16:9 privacy-enhanced player from youtube-nocookie.com.
The normal «Смотреть на YouTube» link remains with or without JavaScript and
when thumbnail/player requests fail. Remote/private/removed videos or videos
with embedding disabled may require opening that link.

The player uses strict-origin-when-cross-origin Referrer Policy, rather than
no-referrer: YouTube requires a Referer for embeds. See
[YouTube's embed instructions](https://support.google.com/youtube/answer/171780?hl=en).

The development/reference example lives at
http://localhost:4321/ml-dl-course-site/guides/authoring-example/ after `npm run dev`.
It remains draft and absent from production. Browser activation tests run with
Chrome detected locally or via `CHROME_PATH`; without Chrome the browser test
explicitly skips, while source/output tests still run. They block external
requests so keyboard/failure checks do not depend on YouTube availability.

## Avoid in ordinary `.md`

- raw HTML for layout;
- Astro components;
- React/Svelte/Vue syntax;
- framework-specific cards;
- Material-for-MkDocs syntax such as `!!! note`;
- icon shortcodes tied to one theme;
- manual layout markup.

## Image convention

Every substantial page owns its images.

Example:

```text
linear-models/
├── index.md
└── assets/
    ├── least-squares-geometry.svg
    ├── logistic-decision-boundary.png
    └── regularization-curves.svg
```

Reference images using relative standard Markdown:

```md
![Граница решений логистической регрессии](./assets/logistic-decision-boundary.png)
```

Do not put textbook illustrations into a global `images/` dump.

Use `public/` only for truly global assets such as:
- logo;
- favicon;
- OpenGraph defaults;
- brand illustrations used across unrelated pages.

## Image naming

Use semantic kebab-case names.

Good:

```text
linear-regression-residuals.svg
confusion-matrix-example.png
attention-qkv-schema.svg
```

Bad:

```text
image1.png
Screenshot 2026-09-29 124731.png
Pasted image 20260929124731.png
pic_final_final2.png
```

Before committing, pasted screenshots must be renamed.

## Recommended Obsidian setup

Open `src/content/` as the vault.

In Obsidian, choose **Open folder as vault** and select that directory, not the
repository root. Enable **Settings → Core plugins → Templates**. Then open
**Settings → Templates** and set **Template folder location** to `_templates`
(relative to the vault). See the [core Templates documentation](https://help.obsidian.md/plugins/templates).

To create a page:

1. Create a `.md` file in the appropriate vault folder from the table below.
2. Open the command palette and run **Templates: Insert template**, then choose
   the matching template. The core plugin substitutes `{{title}}` with the file
   name and `{{date:YYYY-MM-DD}}` with today's date.
3. Edit `title` (especially for a file named `index.md`) and `description`, then
   write the body below the frontmatter. All templates start with `draft: true`.
4. For assignments, exams, and organizational course pages, fill the initially empty `courseId` and `termId`
   with the deliberately chosen course identifiers. Templates do not assign
   a semester to historical material. For notes, review `publishedAt` and `tags`.

| Template | Destination relative to the vault | Content model |
| --- | --- | --- |
| `textbook` | `docs/textbook/<topic>/index.md` | `contentKind: textbook` |
| `guide` | `docs/guides/<topic>/index.md` | `contentKind: guide` |
| `assignment` | `docs/courses/<courseId>/<termId>/assignments/<slug>.md` | `contentKind: assignment` |
| `exam` | `docs/courses/<courseId>/<termId>/exam.md` | `contentKind: exam` for an explicitly confirmed exam |
| `course-page` | `docs/courses/<courseId>/<termId>/<slug>.md` | `contentKind: reference` for organizational pages |
| `note` | `notes/<semantic-slug>.md` | Separate `notes` collection |

The `_templates/` files contain frontmatter only and sit outside all collection
loader roots, so they are not pages. Personal vault settings in `.obsidian/`
are ignored by Git; configure the interface locally.

Recommended settings:

- generate **Markdown links**, not WikiLinks;
- use relative links where possible;
- set new attachments to a subfolder under the current page folder named `assets`;
- enable automatic internal-link updates when files are renamed.

For pasted screenshots, use an attachment-renaming plugin or rename immediately after paste.
A simple workflow is:

1. paste screenshot;
2. give it a semantic name;
3. Obsidian updates the link;
4. continue writing.

Optional convention for pages with many screenshots:

```yaml
---
imageNameKey: linear-models
---
```

This field can be used by attachment-renaming plugins and is accepted by the site schema.

## Порядок глав в Obsidian

Для vault `src/content/` установите community plugin
[Custom File Explorer sorting](https://github.com/SebastianMC/obsidian-custom-sort):
**Settings → Community plugins → Browse**, найдите плагин, нажмите **Install**, затем **Enable**.
Нажмите кнопку плагина на боковой ribbon-панели, чтобы применить сортировку.

Спецификация уже находится в [src/content/sortspec.md](src/content/sortspec.md).
Плагин автоматически читает заметки с именем `sortspec.md`; назначать отдельную
заметку в его настройках не требуется. Два `target-folder` заданы относительно
корня vault: `docs/textbook/ml` и `docs/textbook/dl`. Папки глав отображаются
в указанном педагогическом порядке. Новые, не перечисленные элементы идут после
них; остальные папки используют обычную сортировку Obsidian.

Для изменения порядка редактируйте многострочное поле `sorting-spec` в Source mode,
сохраняя YAML-отступы, затем выключите и включите сортировку кнопкой плагина.
Повторное нажатие отключает её и возвращает стандартный порядок.
Правила меняют только отображение: имена папок, ссылки и `sidebar.order` сайта
остаются прежними. Служебная заметка хранится в корне vault, вне всех коллекций
Astro; не переносите её в `docs/`, `courses/` или `notes/`. Она не публикуется
и не попадает в поиск сайта. Настройки и файлы установки плагина в `.obsidian/`
остаются локальными и не коммитятся.

## Drafts, local preview, and publication

`draft: true` keeps a material available in development while excluding it from
production pages and generated lists/navigation. Omitting `draft`, or setting
`draft: false`, means published. The `docs` collection uses
[Starlight's native draft field](https://starlight.astro.build/reference/frontmatter/#draft)
without a custom loader or route filter. The installed Starlight 0.42.4 excludes
drafts in production mode. The custom `notes` and `courses` routes and lists
apply the equivalent filter. A course's publication flag is separate from its
`status`: `status: draft` alone does **not** hide a course; use `draft: true`.

Starlight's autogenerated sidebar omits draft documents in production. An
explicit sidebar `slug` pointing to a draft makes Starlight's production build
fail. Do not add raw draft URLs to manual navigation or published Markdown:
such links are not automatically removed; `npm run validate` catches broken
internal links in the built site. A public course referencing a draft document
in `pages` or a visible module fails the production build with a descriptive
error. Development permits those references so related drafts can be reviewed
together. Hiding a course manifest does not hide its independent documents:
set `draft: true` on each unfinished page as well.

Run commands from the **repository root**, not the vault directory:

```sh
npm run dev
```

Open <http://localhost:4321/ml-dl-course-site/>. Draft documents use their normal
URLs; draft notes appear in `/ml-dl-course-site/notes/`, and draft courses in
`/ml-dl-course-site/courses/`. Changes are refreshed while the server runs.
If Node.js is not on the Windows PATH, see the local setup in [README.md](README.md).

Before publication, fill the metadata, review the page and its links, then
change `draft: true` to `draft: false`. Publish any referenced documents needed
by a public course. Run the full verification **before committing**:

```sh
npm run validate
```

To review exactly the production output, run `npm run build` followed by
`npm run preview` and open the URL printed by Astro. This preview serves the
built site and therefore does **not** show drafts. Development visibility is
an authoring convenience, not access control for source files in Git.

## Alt text

Every meaningful image needs useful alt text.

Bad:

```md
![](./assets/plot.png)
```

Good:

```md
![Зависимость ошибки на обучающей и контрольной выборках от глубины дерева](./assets/tree-depth-validation-error.svg)
```

Decorative images may use empty alt text intentionally.

## Interactive pages

Ordinary content remains `.md`.

If a page needs an actual component, rename only that page to `.mdx`.

Example:

```mdx
---
title: Линейная регрессия
---

import LinearRegressionPlayground from '../../../../components/interactive/LinearRegressionPlayground.svelte';

Обычный текст страницы остаётся Markdown.

<LinearRegressionPlayground client:visible />
```

The interactive component is an enhancement, not the storage location for the lesson text.

## Runnable Python

There are three levels:

1. **Static code example** — normal fenced code block.
2. **Small runnable browser example** — Pyodide/JupyterLite or a custom interactive component.
3. **Heavy ML/DL computation** — external notebook/runtime (GitHub, Colab, DataSphere, etc.).

Do not load a browser Python runtime on every page by default.

## Course manifests

Create one YAML manifest at `src/content/courses/<courseId>/<termId>.yaml`.
The path must match its `courseId` and `termId`. The published Fall 2026 courses are
`deep-learning`, `ai-design`, and `intro-ml-dl-pish`. Their `status: active` and
`draft: false` publish the course pages; `modules: []` is valid while the program
is added during the semester. Empty modules display an explanatory message.
Add or reorder modules when the program is known; a complete advance plan is not required.

For organizational documents, insert the `course-page` template from
`_templates/course-page.md` into `docs/courses/<courseId>/<termId>/<slug>.md`.
Fill `title`, `description`, `courseId`, and `termId`; it uses
`contentKind: reference` and starts with `draft: true`. Review and publish the
document before adding its collection ID to a public manifest's `pages`.
Organizational pages include `overview.md`, `assessment.md`, `schedule.md`,
`exam.md`, and `resources.md`. Keep an «Информация обновляется» warning on
unfilled pages; replace it with actual information when the page is ready.
The `exam` role/file name is a stable identifier; its display label is neutral
«Аттестация» and does not determine the actual assessment format.

A course page at `/courses/<courseId>/<termId>/` is generated from the manifest.
It contains a route through materials, not copies of their text. List modules
in the intended reading order. Their numbers are generated from positions in
the `modules` array (1, 2, 3, …), independently of textbook chapter or assignment
numbers. Use the optional `label` field for exceptions; `number` is not part of the schema.

Only when a special display label is needed, set an optional nonempty string
`label`, for example `label: Практикум`. It replaces the displayed number, but
does not change the sequence, the next module's number, or the `module-<position>`
anchor. Hidden modules retain their positions in the manifest; publishing one
does not renumber the following modules.

Keep course-wide organizational documents in the separate top-level `pages`
array. It defaults to empty and does not contribute to module numbering.
Each item requires `role` and `doc`, with an optional link `label`. Allowed roles
are `overview`, `assessment`, `exam`, `schedule`, `policy`, `resources`, and `other`.
These are internal collection references only: `href` and external links are
not accepted in `pages`. Items keep their YAML order and appear under «О курсе».

Use `type: doc` for an internal module resource. A module can reference several
independent textbook pages; repeat `role: theory` as many times as necessary.
There is no one-to-one relationship between modules and chapters. The following
is a syntax example, not a proposed program for the Fall 2026 courses:

```yaml
pages:
  - role: assessment
    doc: courses/deep-learning/2026-fall/assessment

modules:
  - title: Основы и линейные модели
    resources:
      - type: doc
        role: theory
        doc: textbook/ml/introduction
      - type: doc
        role: theory
        doc: textbook/ml/linear-models
      - type: link
        role: notebook
        label: Пример внешней ссылки
        href: https://example.com/#notebook
```

`doc` is a content collection ID, not a URL or filesystem path: omit the site
prefix, `.md`, and trailing `/index`. If the document sets a custom `slug`, use
that ID. `reference('docs')` converts the YAML value into a typed collection
reference, and the page resolves it with `getEntry()`. The optional `label`
overrides the document's title. External resources use `type: link` with an
absolute URL and a required label; do not use that form for internal documents.

Resource roles are `theory`, `assignment`, `guide`, `notebook`, `slides`,
`repository`, `exam`, `competition`, and `other`. They are grouped under Russian
headings under «Учебная программа»; resources within each group retain their YAML order.

Course statuses `draft`, `active`, `completed`, and `archived` are displayed
as labels independently of the publication flag `draft`. The three real Fall 2026
courses use `status: active` and `draft: false`; `draft: true` is reserved for
materials still being authored.
A module with `published: false` is hidden; omitted `published` means
`true`. References in `pages` and **all** modules are validated before filtering.
For public courses, missing documents fail `astro build` with the manifest ID,
page role/position or module position, and document ID. Organizational pages and
visible module resources also cannot link to `draft: true` documents in production.
Hidden modules may reference existing drafts because their links are not rendered.
A `draft: true` manifest is skipped in production; its references are resolved
when its page is opened in development.
`astro sync` checks the schema; `astro build` additionally
checks that referenced documents actually exist.

## Rendering and verification

The site uses Astro's supported Satteri processor, configured in
`astro.config.mjs`. GFM tables and footnotes, code highlighting, and local images
use the existing Astro/Starlight pipeline. Image paths are resolved from the
Markdown file; Astro emits production assets with the site's URL prefix.
Smart punctuation is disabled so quotes and dashes are not automatically rewritten.
GIF files remain GIF, byte-for-byte, through a small service using the public
[Astro Image Service API](https://docs.astro.build/en/reference/image-service-reference/);
other formats retain the standard Sharp optimization. This adds no client JavaScript.

The textbook overview lists chapters in two ordered ML/DL groups and hides draft links
in production. Native Starlight autogeneration reads sidebar.order and applies draft
filtering. A small [route-data middleware](https://starlight.astro.build/guides/route-data/)
removes redundant single-page folder groups from the textbook sidebar.
Chapter files use page-local index.md/assets directories; public routes and content IDs
do not depend on the index.md filename.

Four small build-time plugins in `src/plugins/` implement the missing conventions:

- `math.ts` renders parsed math nodes with KaTeX as HTML plus accessible MathML.
  Its literal HTML nodes preserve inline context; `features.rawHtml` lets Satteri
  parse them into elements for both Markdown and MDX. KaTeX CSS and fonts are
  bundled locally; no KaTeX JavaScript runs in the browser.
- `obsidian-callouts.ts` converts marked blockquotes into `aside` or `details`,
  preserving their Markdown children. Styling lives in `src/styles/content.css`.
  Authors do not write the generated HTML or import UI components.

- `code-language.ts` preserves an explicitly declared fence language for native
  Expressive Code after raw HTML processing rebuilds the syntax tree. It copies
  the existing language class into the metadata expected by the installed renderer,
  without guessing a language or changing code. Starlight supplies highlighting,
  its existing light/dark themes and copy buttons; no custom theme is configured.

- `youtube.ts` transforms the YouTube callouts described above into lightweight previews.

`@astrojs/markdown-satteri` and `satteri` are explicit dependencies because the
configuration and plugins use their public APIs. No extra browser framework is added.

Run `npm test` for transformation and course tests. The course integration test
builds an isolated copy under `.tools/`, verifies numbering, section boundaries,
several textbook pages per module, generated links, and custom slugs. It also
checks invalid schemas and missing references in both modules and `pages`. It removes only its
own temporary directory and does not edit the author's manifest.
The draft integration test expands the actual Obsidian templates into temporary
content, checks their parsed schemas and development routes, and builds production
output to verify default publication, draft exclusion, and rejection of public
course references and explicit sidebar slugs pointing to drafts.
Run `npm run validate` before committing:
it runs the tests, checks types/content, builds the site, checks internal links,
and verifies published courses, warnings and links, plus isolated authoring
examples, highlighted code, images, and fonts.
`npm run check:authoring` runs the generated-output tests alone after a build.

## About and Notes

Edit «Обо мне» in `docs/about/index.md` inside the Obsidian vault. It is a
public `contentKind: reference` page. Edit the biography and contacts directly in Markdown.

Notes stay in `notes/` and use the existing `note` template. The public index
shows the title, `publishedAt`, description, tags and optional `updatedAt`, sorted
by publication date (newest first). Dates are displayed in Russian using UTC so
local time zones do not shift their calendar day. Tags are metadata, not links
to unimplemented tag archives. The individual page displays the same metadata.
The index shows an empty state when there are no published notes. Drafts remain
visible in development and are excluded from production lists, pages and search.

Use a semantic filename such as `cross-entropy.md`; it becomes `/notes/cross-entropy/`.
Renaming a published note changes its URL and requires a deliberate redirect decision.

The Markdown authoring example remains a development/reference page. Its
sidebar entry is enabled only in development; it is absent from production.
