# Introduction to ML & DL course site

Учебник по машинному и глубокому обучению, материалы семестровых курсов,
практические инструкции и авторские заметки.

## Stack

- Astro + Starlight;
- Markdown / Obsidian;
- Astro Content Collections для документов, YAML-манифестов курсов и заметок.

## Local development

Используйте Node.js 24 (см. `.nvmrc`). Зависимости зафиксированы в `package-lock.json`.

```sh
npm ci
npm run dev
```

Сайт: <http://localhost:4321/ml-dl-course-site/>.

В Windows, если используется локальная копия Node.js и её нет в PATH:

```powershell
$env:Path = (Resolve-Path '.tools/node-v24.21.0-win-x64').Path + ';' + $env:Path
npm.cmd ci
npm.cmd run dev
```

Локальный Node.js не входит в Git; на другой машине установите Node.js отдельно.

## Content

| Путь | Назначение |
| --- | --- |
| `src/content/docs/textbook/` | Каноническая теория, независимая от курсов |
| `src/content/docs/guides/` | Общие практические инструкции |
| `src/content/docs/courses/` | Организационные страницы, задания и аттестация |
| `src/content/courses/` | YAML-манифесты: семестр, страницы и последовательность модулей |
| `src/content/notes/` | Датированные авторские публикации |

## Authoring

Откройте `src/content/` как Obsidian Vault. Шаблоны в `_templates/`
создают материалы с `draft: true`: они видны в dev и исключены из production.
Подробности, включая формулы, изображения, course references и YouTube,
описаны в [AUTHORING.md](AUTHORING.md).
Архитектура — в [ARCHITECTURE.md](ARCHITECTURE.md), правила работы — в [AGENTS.md](AGENTS.md).

## Validation

```sh
npm run validate
```

Команда запускает функциональные тесты, проверки типов/коллекций, production build,
проверку внутренних ссылок и проверки готовых страниц. Браузерные тесты используют
локальный Chrome/Chromium (или `CHROME_PATH`); при его отсутствии выводится явный skip.
Проверки не требуют побайтового совпадения авторского текста с историческими версиями.

Для просмотра production:

```sh
npm run build
npm run preview
```

`npm run check:links` и `npm run check:authoring` проверяют готовый `dist/`.
`npm run check` проверяет типы и коллекции, `npm run check:content` — только коллекции.
Внешние сайты link check не проверяет.
Для проверки production preview в Chrome используйте
`npm run check:browser -- http://localhost:4321/ml-dl-course-site/`: проверяются
основные страницы, mobile/light/dark, Pagefind и YouTube.

## Themes

Активна **Research Brown**. Альтернативы Editorial, Technical и Research сохранены
в `src/styles/themes/`. Тема выбирается одним импортом в `src/styles/design.css`;
общий `shared.css` сохраняется. Light/dark переключается средствами Starlight.

## Deployment

Текущая публикация использует legacy MkDocs workflow
`.github/workflows/deploy.yml`. Исходники `docs/`, `mkdocs.yml` и Python-зависимости
сохранены для действующего сайта и rollback. Переключение GitHub Pages на Astro
выполняется отдельным cutover. Карта старых URL хранится в
[migration/route-map.csv](migration/route-map.csv).

Генерируемые `dist/`, `.astro/`, `node_modules/`, локальные `.tools/`
и личные настройки Obsidian не коммитятся.
