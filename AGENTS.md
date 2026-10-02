# AGENTS.md

## Project purpose

This repository contains an author-oriented educational website for machine learning and deep learning.

The target stack is Astro + Starlight.

The site contains four distinct content domains:

1. **Textbook** — canonical course-independent theory.
2. **Courses** — semester-specific orchestration and assessment material.
3. **Guides** — reusable practical instructions.
4. **Notes** — dated author articles and shorter material.

Preserve these boundaries in every change.

---

## Primary architectural rule

**Never duplicate canonical textbook theory inside a course.**

A course should reference canonical textbook pages and add only course-specific information such as:

- ordering;
- schedule;
- assignments;
- deadlines;
- slides;
- notebooks;
- repositories;
- exam information;
- cohort-specific instructions.

If the same explanation would be useful in more than one course, it belongs in the textbook or guides.

---

## Migration safety

The existing MkDocs implementation is production content.

During migration:

- do not delete or destructively rewrite legacy material unless the task explicitly requests it;
- do not change the meaning of teaching materials during mechanical migration;
- do not silently shorten, rewrite, modernize, or “improve” explanations;
- preserve formulas, code, images, links, headings, and pedagogical structure unless a change is explicitly requested;
- record every changed public route in `migration/route-map.csv`;
- prefer small reviewable migration batches;
- keep the current production site deployable until cutover.

A migration task is not an editorial rewrite task.

---

## Content model

### Textbook

Location:

```text
src/content/docs/textbook/
```

Properties:

- canonical;
- course-independent;
- living content;
- organized by topic, not by lecture number or semester.

### Guides

Location:

```text
src/content/docs/guides/
```

Properties:

- shared across courses;
- procedural;
- examples: Git, GitHub Classroom, DataSphere, environment setup.

### Course-specific pages

Location:

```text
src/content/docs/courses/<course-id>/<term-id>/
```

Examples:

- assignments;
- exam information;
- competition rules;
- semester-specific resources.

Do not place general theory here.

### Course manifests

Location:

```text
src/content/courses/<course-id>/<term-id>.yaml
```

Course manifests describe the sequence of modules and references to theory, assignments, notebooks, slides, and external resources.

Do not duplicate long prose in course manifests.

### Notes

Location:

```text
src/content/notes/
```

Notes are dated author publications and may later be promoted into textbook content.

---

## Markdown authoring contract

The content must remain comfortable to edit in Obsidian.

### Default format

Use `.md`.

### Allowed in ordinary Markdown

- CommonMark / GitHub-Flavored Markdown;
- YAML frontmatter;
- standard Markdown links;
- standard Markdown images;
- tables;
- fenced code blocks;
- LaTeX math;
- footnotes;
- Obsidian-style callouts.

### Avoid in ordinary Markdown

- raw HTML used for layout;
- JSX;
- Astro components;
- framework-specific syntax;
- Material-for-MkDocs-specific syntax;
- theme-specific icon shortcodes;
- presentation markup.

UI and layout concerns belong in Astro components and layouts.

### MDX exception

Use `.mdx` only when the page needs an embedded interactive component.

Do not convert a page to MDX merely to get a nicer card, button, grid, icon, or spacing.

---

## Images and attachments

Prefer page-local assets.

Example:

```text
src/content/docs/textbook/ml/linear-models/
├── index.md
└── assets/
    ├── least-squares-geometry.svg
    └── logistic-decision-boundary.png
```

Use relative Markdown links:

```md
![Описание](./assets/logistic-decision-boundary.png)
```

Rules:

- use semantic kebab-case filenames;
- do not add `Pasted image ...`, `Screenshot ...`, `image1.png`, or similar generated filenames;
- preserve meaningful alt text;
- do not move local content images into `public/` merely to make paths easier;
- reserve `public/` for genuinely global site assets;
- when moving a page, move its local assets with it and update links.

---

## Interactive content

Interactive teaching widgets live in:

```text
src/components/interactive/
```

Astro's client islands are allowed for interactive components.

Use client-side hydration only for components that actually need it.

Preferred principles:

- static HTML first;
- load interactive code lazily when reasonable;
- one component should do one clearly defined teaching job;
- keep explanatory prose in Markdown;
- provide a non-interactive explanation or fallback when practical;
- do not make essential course instructions depend on JavaScript.

For lightweight Python execution, a browser runtime such as Pyodide/JupyterLite may be used deliberately.
Do not attempt browser-side execution for heavyweight GPU training or large ML dependencies.

---

## Course versioning

Courses are historical.

Use explicit term identifiers such as:

```text
2026-fall
2027-spring
```

A past course term should not be silently mutated into the current course.

The textbook is living canonical content and is not duplicated per semester by default.

---

## URLs

Prefer stable semantic URLs.

Good:

```text
/textbook/ml/linear-models/
/guides/github-classroom/
/courses/ml/2026-fall/assignments/hw-03/
```

Avoid encoding transient implementation details in public URLs.

For every legacy public route that changes, add a row to:

```text
migration/route-map.csv
```

Do not remove a legacy route without either preserving it or intentionally redirecting it.

---

## Astro / Starlight structure

Use Starlight's supported `docs` content collection for textbook, guides, and course-specific Markdown pages.

Use separate Astro content collections for:

- course manifests;
- notes.

Do not reimplement Starlight functionality without a concrete need.

Prefer supported public APIs over internal package APIs.

---

## Styling

The design should feel like an author-led educational publication, not product documentation and not a departmental portal.

Design principles:

- typography first;
- generous whitespace;
- readable line length;
- calm visual hierarchy;
- clear textbook/course distinction;
- restrained cards and decorative UI;
- responsive design;
- accessible contrast and keyboard interaction.

MAI affiliation may be present as context, but should not dominate the global identity of the site.

Avoid unnecessary visual novelty.

---

## Code quality

Before considering a task complete:

1. run the production build;
2. run type checking if configured;
3. validate content collections;
4. check internal links with the repository's link-checking command;
5. report any remaining warnings;
6. inspect changed public routes;
7. do not claim success if the build fails.

If a required validation command does not exist, propose or add one when appropriate rather than inventing a command in the report.

---

## Editing discipline

- Inspect nearby existing files before introducing a new pattern.
- Prefer one established pattern over several equivalent patterns.
- Keep commits and diffs focused.
- Do not mix migration, redesign, and editorial rewriting in the same change unless explicitly requested.
- Do not add dependencies for trivial functionality.
- Explain any dependency that materially increases client-side JavaScript.
- Preserve Russian text encoding as UTF-8.
- Preserve mathematical notation exactly unless explicitly correcting it.

---

## When uncertain

If a requested change conflicts with these architectural rules:

1. do not silently choose a different architecture;
2. identify the conflict in the task report;
3. prefer the smallest reversible change;
4. preserve existing content and URLs until the ambiguity is resolved.

For autonomous migration work, choose conservative reversible transformations over speculative redesign.
