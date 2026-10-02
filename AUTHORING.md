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

## Rendering and verification

The site uses Astro's supported Satteri processor, configured in
`astro.config.mjs`. GFM tables and footnotes, code highlighting, and local images
use the existing Astro/Starlight pipeline. Image paths are resolved from the
Markdown file; Astro emits production assets with the site's URL prefix.
Smart punctuation is disabled so quotes and dashes are not automatically rewritten.

Two small build-time plugins in `src/plugins/` implement the missing conventions:

- `math.ts` renders parsed math nodes with KaTeX as HTML plus accessible MathML.
  Its literal HTML nodes preserve inline context; `features.rawHtml` lets Satteri
  parse them into elements for both Markdown and MDX. KaTeX CSS and fonts are
  bundled locally; no KaTeX JavaScript runs in the browser.
- `obsidian-callouts.ts` converts marked blockquotes into `aside` or `details`,
  preserving their Markdown children. Styling lives in `src/styles/content.css`.
  Authors do not write the generated HTML or import UI components.

`@astrojs/markdown-satteri` and `satteri` are explicit dependencies because the
configuration and plugins use their public APIs. No extra browser framework is added.

Run `npm test` for transformation tests. Run `npm run validate` before committing:
it tests the plugins, checks types/content, builds the site, checks internal links,
and verifies the generated demonstration HTML, highlighted code, images, and fonts.
`npm run check:authoring` runs the generated-output tests alone after a build.
