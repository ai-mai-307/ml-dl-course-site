# Task 6B — legacy guides as outdated reference material

Ветка: `site-v2`. Перенесены только пять запрошенных инструкций,
каждая с `contentKind: guide` и `draft: false`.
Они доступны в production output как архивные справочные материалы.

## Страницы и источники

| Legacy-источник | Новый маршрут | Изображения |
| --- | --- | --- |
| docs/index/howtoclassroom.md | /guides/github-classroom/ | 5 |
| docs/index/clone_repo.md | /guides/datasphere/clone-repository/ | 10 |
| docs/index/datasphere_commint_and_push.md | /guides/datasphere/commit-and-push/ | 9 |
| docs/index/what_is_dataset.md | /guides/datasphere/datasets/ | 5 |
| docs/index/manage_budget.md | /guides/datasphere/budget/ | 3 |

Каждая страница хранится как `src/content/docs/guides/<route>/index.md`.
Все 32 исходных PNG скопированы в соседнюю папку `assets/` побайтово,
с семантическими kebab-case именами. Размеры файлов, контрольные суммы и
точные преобразования записаны в `migration/task-6b-manifest.json`.
Новые описательные alt-тексты заменяют пустые или числовые исходные подписи;
старые и новые значения сохранены в манифесте.

## Предупреждения и сохранность

Первый блок после заголовка каждой страницы — обычный Markdown Obsidian callout
`[!WARNING]`. GitHub Classroom получил указанный текст «Архивная инструкция»:
на осенний семестр 2026 года он не используется в текущих курсах.
На всех четырёх DataSphere страницах указан точный текст о непредоставленном
грантовом доступе и изменившихся интерфейсе/порядке работы.
Budget дополнительно прямо обозначает прежнюю схему грантового доступа и то,
что сейчас страница не является рабочей инструкцией; её ссылки относятся к прежнему курсу.

Текст, порядок шагов, ссылки, code fences и предупреждения источника сохранены.
Записанные механические преобразования:

- локальные пути изображений и описательные alt-тексты;
- начальный H1 перенесён в frontmatter для clone-repository, datasets и budget;
- внутренний H1 «Как принимать задания» в Classroom стал H2: вводный текст
  перед ним сохранён, общий заголовок страницы задаёт Starlight;
- два Material `!!! danger` стали `[!DANGER]` без изменения текста:
  предупреждение о файлах более 100 МБ и предупреждение о некорректном отображении биллинга.

Source-preservation тест применяет только записанные преобразования и сравнивает
всё оставшееся тело страницы с legacy. Он также проверяет пять source SHA-256
и все 32 изображения. Изменение процедур, редакторское исправление опечаток и
актуализация по текущему интерфейсу не выполнялись.

## Архивные ссылки и ограничения

Сохранены course-specific значения: прежняя Telegram-ссылка в clone-repository,
ссылка на Google-таблицу бюджета, URL старого billing account и упоминания чатов,
команд и токена преподавателя. Новые значения не выдумывались.
Источник Classroom содержит некорректно составленную ссылку:
`https://git-scm.com/https://git-scm.com/book/ms/v2/Getting-Started-About-Version-Control?utm_source=chatgpt.co`.
Она сохранена как дефект исходника. Внешние URL не проверялись на актуальность,
доступность или применимость к осени 2026: это архивная миграция.

## Навигация и маршруты

`/guides/` теперь перечисляет все пять инструкций и содержит общее предупреждение.
Sidebar включает обзор, архивный GitHub Classroom и группу
«DataSphere — требует обновления» с четырьмя страницами.
В `migration/route-map.csv` добавлены пять переходов от legacy URL
`/index/<source-name>/` с состоянием `migrated-published-outdated`.
Redirects и cutover не настроены. Действующий MkDocs и исходные assets не менялись.

Расписание, оценивание, LLM policy, course workflow, assignments и exams
в рамках Task 6B не переносились. Темы Research Brown и остальные CSS не менялись.
Новые dependencies и клиентский JavaScript не добавлены.

## Изменённые и созданные файлы

Созданы пять guide-страниц и 32 page-local PNG, миграционный манифест, этот отчёт,
`tests/guides-migration.test.mjs` и `tests/built-guides.test.mjs`.
Изменены `src/content/docs/guides/index.md`, `astro.config.mjs`,
`migration/route-map.csv` и `package.json` — новые source/output-тесты включены
в существующие команды. Package lock и dependencies сохранены.

## Проверки

- `npm run validate` запущен, но остановился на tests: **30/32**.
  Прошли все три новых guide-preservation теста.
  Два прежних tests всё ещё требуют исторический текст/хэш
  `textbook/dl/neural-network-foundations`, уже изменённый автором:
  `baseline covers exactly nine lectures and preserves all content outside recorded mechanical edits`
  и `fence audit preserves all code and other chapters except their publication flag`.
  Текст этой главы и эти tests не менялись в Task 6B. Параллельные правки автора
  в рабочем дереве сохранены; исторический аудит не перезаписан.
- После остановки validate следующие стадии выполнены отдельно:
  `npm run check` — 18 файлов, 0 errors, 0 warnings, 0 hints в type diagnostics;
  синхронизация content collections прошла.
- `npm run build` — success, **21 страница**, включая все пять guides;
  Pagefind индекс создан; собрано 103 изображения сайта (71 textbook + 32 guides).
- `npm run check:links` — **21 HTML / 1481 внутренний URL**, битых ссылок и якорей нет.
- `npm run check:authoring` — **7/7**, включая два новых output-теста:
  первый warning, исходные danger, все изображения, обзор и sidebar.

Оставшиеся предупреждения сборки: пустые `notes`, необязательная `i18n` и
KaTeX strict о символах исходного учебного контента. Git сообщает о нормализации
LF → CRLF в Windows. Новых build errors от guides нет.
Полный validate нельзя считать успешным до отдельного согласования авторских
изменений учебника с историческими тестами миграции.

## Desktop/mobile и light/dark

Все пять страниц проверены в production preview при 1440 и 390 px в light/dark:
**20 сочетаний**. Предупреждение — первый элемент контента и начинается в первом
экране; budget содержит усиленный текст. Проверены загрузка всех изображений,
непустой alt, положительные размеры, сохранение пропорций, исходные danger,
порядок списков и отсутствие горизонтального переполнения документа.
Обзор содержит рабочие ссылки на все страницы в каждом сочетании.

Подключённых браузеров skill Browser не обнаружил; использован локальный headless
Chrome/CDP с отдельным профилем. Просмотрены screenshots desktop/dark budget,
mobile/light Classroom и mobile/dark изображения clone-repository.
Временные результаты и screenshots находятся в игнорируемых
`.tools/task6b-browser-results.json` и `.tools/task6b-*.png`.

## Ручной просмотр

Запущенный production preview:

- [Обзор инструкций](http://127.0.0.1:4326/ml-dl-course-site/guides/)
- [GitHub Classroom](http://127.0.0.1:4326/ml-dl-course-site/guides/github-classroom/)
- [Клонирование репозитория](http://127.0.0.1:4326/ml-dl-course-site/guides/datasphere/clone-repository/)
- [Коммит и push](http://127.0.0.1:4326/ml-dl-course-site/guides/datasphere/commit-and-push/)
- [Датасеты](http://127.0.0.1:4326/ml-dl-course-site/guides/datasphere/datasets/)
- [Бюджет](http://127.0.0.1:4326/ml-dl-course-site/guides/datasphere/budget/)

Для нового запуска: `npm run build`, затем `npm run preview`;
используйте адрес, который напечатает Astro. Публикация на хостинг не выполнялась.
