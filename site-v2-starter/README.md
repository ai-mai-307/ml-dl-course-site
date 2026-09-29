# site-v2 starter specification

This is a **reference starter package**, not a ready-to-deploy Astro project.

The intended workflow is:

1. Keep the current MkDocs site on `main` untouched while migration is in progress.
2. Create a `site-v2` branch.
3. Scaffold a fresh Astro + Starlight project using the current official CLI.
4. Copy/adapt the files from this package into that scaffold.
5. Migrate one representative vertical slice before batch migration.

See:
- `ARCHITECTURE.md` — target architecture and file tree;
- `AUTHORING.md` — Markdown/Obsidian/image authoring rules;
- `AGENTS.md` — repository instructions for Codex;
- `CODEX_TASKS.md` — ordered first tasks and prompt templates;
- `src/content.config.ts` — proposed Astro Content Collections schemas;
- `migration/route-map.csv` — redirect/migration tracking template.
