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
