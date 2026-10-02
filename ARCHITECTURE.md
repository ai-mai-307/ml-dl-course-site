# site-v2 architecture

## Goal

Build an author-oriented educational website for ML/DL materials with four clearly separated concerns:

1. **Textbook** — canonical, course-independent theory.
2. **Courses** — semester-specific orchestration: schedule, sequence, assignments, slides, notebooks, deadlines.
3. **Guides** — reusable practical instructions: Git, GitHub Classroom, DataSphere, environments, etc.
4. **Notes** — author blog / shorter articles / additions that may later become textbook chapters.

The current MkDocs site remains production until the replacement is verified.

## Main technical decisions

- Framework: **Astro + Starlight**
- Hosting initially: **GitHub Pages**
- Main authoring format: **plain Markdown (`.md`)**
- Special interactive pages only: **MDX (`.mdx`)**
- Main writing environment: **Obsidian**, opening `src/content/` as the vault
- Canonical theory must not be duplicated inside course folders
- Course structure is stored as validated YAML manifests
- Page-local images live next to the page that uses them
- Global site assets live outside content

## Target public URL model

```text
/
├── textbook/
│   ├── ml/
│   └── dl/
├── courses/
│   ├── ml/
│   │   ├── 2026-fall/
│   │   └── ...
│   └── dl/
├── guides/
├── notes/
└── about/
```

## Target repository tree

```text
.
├── AGENTS.md
├── AUTHORING.md
├── ARCHITECTURE.md
├── CODEX_TASKS.md
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   └── brand/
│
├── src/
│   ├── content.config.ts
│   │
│   ├── content/
│   │   ├── docs/
│   │   │   ├── textbook/
│   │   │   │   ├── ml/
│   │   │   │   │   ├── introduction/
│   │   │   │   │   │   ├── index.md
│   │   │   │   │   │   └── assets/
│   │   │   │   │   ├── preprocessing/
│   │   │   │   │   ├── linear-models/
│   │   │   │   │   │   ├── index.md
│   │   │   │   │   │   └── assets/
│   │   │   │   │   └── ...
│   │   │   │   └── dl/
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── guides/
│   │   │   │   ├── git/
│   │   │   │   ├── github-classroom/
│   │   │   │   ├── datasphere/
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── courses/
│   │   │       ├── ml/
│   │   │       │   └── 2026-fall/
│   │   │       │       ├── assignments/
│   │   │       │       ├── exam/
│   │   │       │       └── resources/
│   │   │       └── dl/
│   │   │
│   │   ├── courses/
│   │   │   ├── ml/
│   │   │   │   └── 2026-fall.yaml
│   │   │   └── dl/
│   │   │       └── 2026-fall.yaml
│   │   │
│   │   └── notes/
│   │       └── YYYY-MM-DD-slug.md
│   │
│   ├── components/
│   │   ├── home/
│   │   ├── course/
│   │   └── interactive/
│   │       ├── LinearRegressionPlayground.svelte
│   │       └── ...
│   │
│   ├── layouts/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── courses/
│   │   ├── notes/
│   │   └── about.astro
│   │
│   └── styles/
│       ├── global.css
│       └── content.css
│
├── migration/
│   ├── inventory.md
│   └── route-map.csv
│
└── legacy/
    └── (optional temporary migration helpers only)
```

## Why course manifests are separate from course pages

A course is not a copy of the textbook. It is a route through canonical materials.

Example:

```yaml
courseId: ml
termId: 2026-fall
title: Классическое машинное обучение
modules:
  - number: 3
    title: Линейные модели
    resources:
      - type: doc
        role: theory
        doc: textbook/ml/linear-models
      - type: doc
        role: assignment
        doc: courses/ml/2026-fall/assignments/hw-03
      - type: link
        role: notebook
        label: Практический notebook
        href: https://example.org/notebook
```

The course landing page is generated from this data.

## Versioning policy

### Textbook
Living canonical content. Do not create semester copies by default.

### Courses
Historical objects. Each semester gets its own manifest and course-specific materials.

### Guides
Living shared documentation unless there is a real reason to preserve an old version.

### Notes
Dated publications.

## Interactive content policy

Most pages remain `.md`.

Use `.mdx` only if the page needs an embedded interactive component.

Interactive components live in `src/components/interactive/`. They must not contain canonical explanatory text that belongs in Markdown.

Good examples:
- adjustable plots;
- decision-boundary demos;
- neural-network architecture explorers;
- attention visualizations;
- small in-browser code runners.

Heavy training jobs, GPU workflows, or large datasets should remain external notebooks/services and be linked from the page.
