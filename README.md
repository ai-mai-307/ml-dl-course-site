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

Production URL: <https://ai-mai-307.github.io/ml-dl-course-site/>.
Astro собирает статический сайт с этим origin, base /ml-dl-course-site
и завершающим слешем в адресах страниц.

- .github/workflows/deploy.yml: PR в main устанавливает зависимости, выполняет
  validation, production build и полный аудит legacy routes. PR не вызывает Pages actions.
  Push в main и ручной запуск на main публикуют dist/ только после успешных проверок.
- .github/workflows/deploy-legacy-mkdocs.yml: только ручной rollback на main;
  собирает сохранённые docs/, mkdocs.yml и requirements.txt и публикует site/.
- Оба workflow используют официальные Pages artifact/deploy actions и environment
  github-pages. Права pages: write и id-token: write есть только у deploy jobs.
  Общая concurrency group исключает одновременную публикацию; текущий deploy
  не отменяется следующей публикацией.
- Node.js 24 выбирается через .nvmrc. configure-pages вызывается с enablement: false:
  источник Pages владелец переключает вручную в Settings.

### Первый cutover — вручную владельцем

Изменение workflow само по себе не переключает существующий источник Pages.
Локальная подготовка не изменяет настройки репозитория.

1. Получите успешную PR-проверку site-v2 → main и завершите ручную проверку материалов.
2. Выполните merge проверенного PR. Для управляемого первого переключения сразу
   отмените автоматически начавшийся **Deploy Astro to GitHub Pages**, пока он
   собирается, и дождитесь его остановки. Пока не запускайте другую публикацию.
3. После merge, когда новые workflow уже находятся в main, выберите **Settings →
   Pages → Build and deployment → Source → GitHub Actions**. Репозиторий и URL
   остаются прежними. Переключение после merge исключает промежуточную работу
   старого gh-pages-push workflow с новым источником Actions. Если первый
   автоматический запуск уже завершился ошибкой до смены Source, продолжите
   новым ручным запуском. В **Settings → Environments → github-pages** проверьте
   Deployment branches and tags: ветка main должна быть разрешена. При публикации
   из ветки раньше могло остаться ограничение только на gh-pages.
4. Откройте **Actions → Deploy Astro to GitHub Pages → Run workflow → main**.
   Дождитесь успешных validation, build, upload и deployment в github-pages.
   Подтвердите environment approval, если такое правило настроено в репозитории.
5. Проверьте публичный сайт: главную, учебник, три курса, инструкции, Notes, About,
   поиск, изображения, несколько старых лекций/инструкций, archive fallback
   и несуществующий адрес. Следующие push в main публикуются автоматически
   после успешной validation.

### Rollback — вручную владельцем

1. Отмените ожидающие/текущие Astro deployments и дождитесь их остановки.
   Временно отключите **Deploy Astro to GitHub Pages** в Actions и приостановите
   push в main, чтобы автоматическая публикация не перезаписала rollback.
2. Запустите **Restore legacy MkDocs to GitHub Pages → Run workflow → main**.
3. Дождитесь strict build MkDocs и deployment в github-pages; проверьте главную
   и старые лекции/инструкции. Pages Source оставьте **GitHub Actions**.
4. Исправьте Astro в отдельной ветке и проверьте локально. Для возврата включите
   Astro workflow и запустите его вручную на исправленной main. Затем возобновите
   обычные push.

Legacy source остаётся на исходных местах и собирается независимо:

~~~sh
python -m pip install -r requirements.txt
python -m mkdocs build --strict
npm run build
npm run check:legacy-routes
~~~

В сохранённом mkdocs.yml есть историческое подключение отсутствующего
javascripts/mathjax.js. Аудит сообщает об этом; rollback воспроизводит исходный сайт
с этим ограничением. Строгая сборка MkDocs сама не проверяет наличие extra_javascript.

### Совместимость URL и проверка артефакта

[migration/route-map.csv](migration/route-map.csv) задаёт штатные статические
redirects Astro. primary-redirect-target означает прямой перенесённый аналог;
archive-fallback — отсутствие точного аналога и переход на нейтральную /archive/.
Главная и 404.html сохраняют адреса. Архивного уведомления нет в основной навигации.
Redirect HTML содержит meta refresh, canonical и обычную ссылку. Статический
GitHub Pages не возвращает для этих файлов отдельный HTTP 301. Старые fragments
не сопоставляются по отдельности: ссылки на переименованные заголовки не гарантируются.

~~~sh
npm ci
npm run validate
npm run build
python -m mkdocs build --strict
npm run check:legacy-routes
npm run check:artifact
~~~

check:artifact запускает обычный локальный HTTP-сервер для физических файлов dist/
только под /ml-dl-course-site/. Проверяет assets, настоящий HTTP 404, Pagefind,
активацию YouTube, все redirects, desktop/mobile и light/dark. Требует Chrome/Chromium
(либо CHROME_PATH), падает при его отсутствии и завершает сервер после проверки.
Для ручного просмотра без Astro preview:

~~~sh
npm run preview:artifact
~~~

Адрес: <http://127.0.0.1:4327/ml-dl-course-site/>. Этот сервер — локальный инструмент
проверки; в Pages artifact он не входит. Публикуется только dist/ (для rollback — site/).
Аудит перечисляет старые HTML и связанные локальные assets; неизвестные внешние
закладки на старые бинарные файлы он обнаружить не может. Полный вывод MkDocs
в Astro не копируется.

Генерируемые dist/, .astro/, node_modules/, локальные .tools/, screenshots,
browser profiles и личные настройки Obsidian не коммитятся.
