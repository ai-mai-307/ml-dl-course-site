# First Codex tasks

Run these as separate tasks. Do not ask one agent to rebuild the entire site in a single pass.

## Task 0 — repository audit, no modifications

```text
Audit this repository as preparation for migration from MkDocs Material
to an Astro + Starlight educational website.

Do not modify any files.

Read AGENTS.md first if it exists.

Classify every current public page into one of:
- textbook candidate
- course landing / semester-specific page
- assignment
- exam / competition
- reusable guide
- global landing page
- obsolete / archive
- unclear

Identify:
- Material-for-MkDocs-specific Markdown;
- raw HTML used for layout;
- theme-specific icon syntax;
- admonitions;
- mathematical content;
- local images and their references;
- notebook/Jupyter integration;
- duplicated theory;
- course-specific information embedded inside theory;
- shared instructions;
- internal links and public URLs that need preservation.

Produce, without editing teaching content:
1. migration/inventory.md
2. a proposed target content tree
3. a draft migration/route-map.csv
4. a list of risky migration patterns
5. a recommended representative vertical slice for the first migration.

Do not migrate pages yet.
```

## Task 1 — scaffold v2 alongside legacy files on the migration branch

```text
Create the new Astro + Starlight application in this branch.

Constraints:
- the current `main` production site must remain untouched;
- do not delete the legacy `docs/`, mkdocs.yml, or requirements yet;
- use the current supported Astro + Starlight setup from official docs;
- configure TypeScript strictly;
- configure Russian as the primary UI/content language;
- add MDX support, but ordinary content must default to `.md`;
- add the content collections from `src/content.config.ts`;
- create only minimal placeholder routes needed to prove the architecture;
- do not migrate the teaching material yet.

Add npm scripts for:
- development;
- production build;
- type/content checks;
- any chosen link check.

Run all validation commands and report results.
```

## Task 2 — implement the authoring contract

```text
Implement the repository authoring conventions in AUTHORING.md.

Goals:
- plain Markdown works as the default;
- LaTeX math renders correctly;
- fenced code blocks render correctly;
- Obsidian-style callouts have a clean site representation;
- local relative images under page-local `assets/` directories render correctly;
- ordinary Markdown must not require raw HTML or MDX for layout.

Create one small demonstration page containing:
- headings;
- inline and block math;
- a code block;
- a callout;
- a local image;
- a table.

Do not introduce course content yet.

If a Markdown transformation plugin is needed, keep it minimal,
document why it exists, and test it.
```

## Task 3 — course manifest and generated course page

```text
Implement the `courses` content collection and a generated course landing page.

Use the example:
src/content/courses/ml/2026-fall.yaml

The generated page must display:
- title and description;
- course status and term;
- module/week sequence;
- resources grouped clearly by role;
- internal references to Starlight docs;
- external links for notebooks/slides/repositories.

Do not duplicate textbook prose on the generated course page.

Add validation so that broken internal collection references fail the build.
```

## Task 4 — first real vertical slice

```text
Migrate one representative ML topic from the legacy site.

Prefer a page that exercises:
- equations;
- images;
- code;
- admonitions/callouts;
- internal links.

Also migrate one related assignment.

Rules:
- preserve meaning and pedagogical content;
- do not rewrite the lesson stylistically;
- convert MkDocs-specific syntax mechanically;
- move page-specific images next to the new page under `assets/`;
- rename opaque image filenames only when the mapping is unambiguous;
- add old-to-new routes to migration/route-map.csv;
- add the migrated theory page and assignment to the example course manifest.

Run build and link validation.

Report every transformation pattern used so it can be reviewed before batch migration.
```

## Task 5 — visual design prototype

```text
Create a visual prototype for:
- the home page;
- textbook landing page;
- course landing page;
- one textbook chapter.

Design direction:
- author-led educational publication;
- typography-first;
- generous whitespace;
- restrained cards;
- less "software documentation" feeling than default Starlight;
- MAI affiliation is contextual, not the global brand.

Do not change content architecture during this task.
Do not batch-migrate more pages.

Reuse Starlight functionality where practical instead of replacing it.
```

## Task 6 — notes/blog

```text
Implement the notes collection and:
- /notes/
- /notes/<slug>/

Support:
- title;
- description;
- publication date;
- optional updated date;
- tags;
- draft state;
- optional local cover image.

Keep notes independent of course semester versioning.
```

## Task 7 — migration tooling

```text
Based on the transformation patterns approved after Task 4,
write conservative migration tooling for repetitive MkDocs syntax.

The tool may transform only known patterns, for example:
- MkDocs admonitions -> the approved callout format;
- known icon/card markup -> semantic Markdown or structured page data;
- predictable image path rewrites.

Requirements:
- dry-run mode;
- clear report of changed files;
- no semantic rewriting;
- do not modify unknown constructs;
- make backups unnecessary by relying on Git, but never overwrite silently
  outside the migration branch.

Test the tool on a small fixture before applying it to real content.
```

## Task 8 — batch migration

Only after the vertical slice and migration tooling are reviewed.

Migrate textbook candidates first, then guides, then course-specific pages.

Do not combine batch migration with a major visual redesign.
