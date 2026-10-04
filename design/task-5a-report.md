# Task 5A — visual design exploration

Подготовлены три концепции в ветке `site-v2`.
Это сравнение визуальных направлений на одной архитектуре и одном контенте.
Начальный preview — Editorial; окончательный выбор темы не сделан.
Все три варианта сохранены. Task 5B не выполнялся.

## Переключение и локальный просмотр

В `src/styles/design.css` замените **одну строку импорта**:

```css
@import './themes/editorial.css';
```

Доступные значения: `editorial.css`, `technical.css`, `research.css`.
Следующий импорт `shared.css` оставьте как есть. Копировать CSS между файлами
не нужно. В dev Vite применяет изменение автоматически; если вкладка осталась
со старым состоянием, обновите её. Для production после смены темы выполните
новую сборку. Light/dark выбираются отдельно штатным переключателем Starlight.

Из корня репозитория:

```sh
npm run dev -- --host 127.0.0.1 --port 4325
```

Сервер проверки оставлен на этом адресе:

- [Главная](http://127.0.0.1:4325/ml-dl-course-site/).
- [Обзор учебника](http://127.0.0.1:4325/ml-dl-course-site/textbook/).
- [Линейные модели](http://127.0.0.1:4325/ml-dl-course-site/textbook/ml/linear-models/).
- [Preprocessing](http://127.0.0.1:4325/ml-dl-course-site/textbook/ml/preprocessing/).
- [Python-примеры](http://127.0.0.1:4325/ml-dl-course-site/textbook/ml/preprocessing/#sklearn-api).
- [Большие языковые модели](http://127.0.0.1:4325/ml-dl-course-site/textbook/dl/large-language-models/).
- [Authoring example: код, формулы, таблица, callouts, изображение](http://127.0.0.1:4325/ml-dl-course-site/guides/authoring-example/).

Обычный `npm run dev` использует порт 4321. Если Node/npm отсутствуют в PATH,
переносимая настройка PowerShell описана в README. Реальные главы остаются
черновиками: `npm run preview` показывает production output без них.

## Три концепции и основные design tokens

| Token / характеристика | A — Editorial / Modern Textbook | B — Technical Handbook | C — Research Notebook |
| --- | --- | --- | --- |
| Учебный текст | Source Serif 4 | Source Sans 3 | IBM Plex Serif |
| UI и заголовки | Source Sans 3 | Source Sans 3 | IBM Plex Sans |
| Код | JetBrains Mono | JetBrains Mono | IBM Plex Mono |
| Максимальная content column | 46rem / 736px | 48rem / 768px | 44rem / 704px |
| Размер учебного текста, narrow → desktop | 18 → 20px | 17 → 18px | 17 → 19px |
| Line-height учебного текста | 1.72 | 1.6 | 1.75 |
| H1, narrow → desktop | 32 → 44px | 30 → 38px | 30 → 40px |
| Отступ перед следующими H2/H3 | 3.25rem | 2.25rem | 3rem |
| Межабзацный отступ | 1.2rem | 0.9rem | 1.1rem |
| Background light | #faf8f3 | #f8fafb | #f7f7ef |
| Текст light | #303740 | #2e414e | #344539 |
| Accent ссылок light | #345187 | #006b80 | #35654d |
| Background dark | #1b1e24 | #141f29 | #18211c |
| Текст dark | #d6d6d2 | #cbd8e0 | #d0dbd2 |
| Accent ссылок dark | #b8cef6 | #9dd9e5 | #b6dbc1 |
| Sidebar | Тихий тёплый фон | Более заметная холодная подложка | Спокойная серо-зелёная подложка |
| H2 separators | Нет | Нет | Тонкая линия под всей обёрткой заголовка |
| Callouts | Левая линия, почти без рамок | Компактная рамка и лёгкое скругление | Прямые линии сверху/снизу и левый акцент |
| Таблицы | Без цветной шапки | Компактная тонированная шапка | Более просторная тонированная шапка |
| Подписи, если есть | Sans | Sans | Mono |

Значения px приведены при стандартном root 16px; размеры используют rem/clamp.
Статья сужается вместе с viewport, UI сохраняет отдельный размер шрифта.
Основные tokens находятся в `themes/<concept>.css`.
Общие правила в `shared.css` только применяют эти tokens.

## Starlight variables и custom selectors

Точка подключения — штатный `customCss` в `astro.config.mjs`,
после KaTeX и существующего `content.css`.
Подход соответствует [официальному CSS API Starlight](https://starlight.astro.build/guides/css-and-tailwind/).

Использованы публичные переменные:

- `--sl-font`, `--sl-font-mono`;
- `--sl-content-width`, `--sl-content-gap-y`;
- `--sl-text-h1`–`--sl-text-h4`, `--sl-text-code`, `--sl-text-code-sm`;
- `--sl-line-height`, `--sl-line-height-headings`;
- палитры `--sl-color-white/black/gray-*`, `--sl-color-accent-*`;
- переменные цвета текста, фона, sidebar/nav, inline code и разделителей.

Отдельные селекторы ограничены следующими задачами:

- `.sl-markdown-content`: serif отдельно от sans UI, размер и интерлиньяж;
- обычные заголовки, strong, ссылки, inline code, таблицы и подписи;
- `.sl-heading-wrapper.level-h2/.level-h3`: ритм и ровные separators.
  Starlight делает сам H2 inline ради anchor-link, поэтому border на H2
  разбивался бы на отдельные линии под каждым переносом;
- собственные `.obsidian-callout` / `.obsidian-callout__title`:
  только рамка, отступы, фон и типографика; семантика типов сохранена;
- обычные изображения и зарезервированные классы figure-small/figure-wide;
- `:focus-visible` для заметного клавиатурного фокуса;
- публичные классы KaTeX: на narrow viewport длинная строчная формула получает
  внутреннюю прокрутку. Это устранило реальный overflow в linear-models
  при увеличенном размере текста Editorial, сохранив HTML и доступный MathML.

Компоненты Starlight не заменялись. Sidebar, TOC, мобильное меню, поиск,
переключатель light/dark, якоря и навигация остаются штатными.
Новых Astro-компонентов, JavaScript, анимаций и Tailwind нет.

## Шрифты и зависимости

Добавлены шесть пакетов Fontsource, все зафиксированы на версии **5.3.0**:

- `@fontsource/source-serif-4`;
- `@fontsource/source-sans-3`;
- `@fontsource/jetbrains-mono`;
- `@fontsource/ibm-plex-serif`;
- `@fontsource/ibm-plex-sans`;
- `@fontsource/ibm-plex-mono`.

Это локальные font assets с OFL-1.1, без runtime JavaScript.
Другие зависимости и их версии не менялись.

В `themes/fonts/` — шесть небольших CSS-файлов с @font-face:
WOFF2 из пакетов, `font-display: swap`, исходные unicode-range
для latin/cyrillic. CDN и local()-подстановка системных шрифтов не используются.
Это проектный вариант [self-hosting Fontsource](https://fontsource.org/docs/getting-started/install)
с [ограничением subsets](https://fontsource.org/docs/getting-started/subsets).

Подключённые начертания:

| Семейство | Начертания |
| --- | --- |
| Source Serif 4, IBM Plex Serif | 400 normal, 600 normal, 400 italic |
| Source Sans 3 | 400 normal, 600 normal, 400 italic — курсив нужен тексту Technical |
| IBM Plex Sans | 400 normal, 600 normal |
| JetBrains Mono, IBM Plex Mono | 400 normal |

В одной сборке присутствуют только семейства активной темы:

| Сборка | WOFF2-файлов design layer | Суммарный размер |
| --- | --- | --- |
| Editorial | 14 | 207 064 bytes ≈ 202 KiB |
| Technical | 8 | 102 656 bytes ≈ 100 KiB |
| Research | 12 | 199 440 bytes ≈ 195 KiB |

Это размер emitted assets, а не объём загрузки каждой страницы: браузер
запрашивает только используемые начертания/символы. Например, UI-курсив Source
Sans не запрашивался на проверенных страницах Editorial. KaTeX fonts в эти
цифры не включены и остаются прежними.

В браузере проверена реальная загрузка webfonts, в том числе через platform
font inspection для русского абзаца, а не только значение font-family.
Все запросы шрифтов идут на локальный сервер. Дополнительно проверены
73 font URL в итоговом CSS Editorial, включая KaTeX: отсутствующих assets нет.

## Syntax highlighting

Сохранены единые штатные light/dark темы Starlight/Expressive Code.
Shiki configuration и CSS синтаксических токенов не менялись.
Code font берётся из `--sl-font-mono`, окружающие панели — из штатных
цветовых переменных Starlight. Поэтому code blocks согласованы с каждой
концепцией без трёх отдельных палитр подсветки.

Все три Python-примера preprocessing сохраняют исходные code bodies.
Проверены различные цвета токенов, внутренний горизонтальный scroll,
36 кликов штатных copy buttons за три концепции и четыре варианта viewport/mode.
Payload совпадает с legacy; в автоматизированном Chrome использован локальный
приёмник Clipboard API без изменения системного буфера обмена.

## Изображения

Обычные изображения центрируются, сохраняют intrinsic size/aspect ratio,
ограничены шириной статьи и не увеличиваются сверх natural size.
Визуально проверены также маленькие изображения внутри большой колонки.

Подготовлены общие CSS-правила:

- normal — стандартное Markdown-изображение, max-width 100%, width auto;
- small — будущий компонент может использовать figure-small, предел 22rem;
- wide — figure-wide использует доступную content column, без выхода
  под sidebar/TOC и без искусственного увеличения растровой картинки.

Классы small/wide пока не назначаются контенту. Авторы не должны добавлять HTML.
Если явный размер понадобится позже, предлагается необязательная metadata-карта
«относительный путь asset → small/normal/wide» в frontmatter, с назначением
класса при сборке. Это только предложение: schema, transformer, DSL и новые
frontmatter поля в Task 5A не внедрены. Captions стилизованы только там,
где они уже существуют; подписи из alt автоматически не генерируются.

## Проверки и ограничения

| Проверка | Результат |
| --- | --- |
| Browser matrix | 3 темы × 6 страниц × 2 ширины × 2 mode = **72 pass** |
| Ширины | 1440px и 390px, высота 1000px |
| Контент в matrix | Главная, textbook landing, linear-models, preprocessing, large-language-models, authoring example |
| Overflow | Нет page overflow; сравнение scrollWidth с clientWidth с учётом scrollbar |
| Изображения | Загрузка, alt, границы колонки, отсутствие upscaling и искажений |
| Code/math/table/callout | Отрендерены; KaTeX/overlay errors нет; таблицы и код сохраняют внутренний scroll |
| Клавиатура | Видимый focus, раскрытие callout пробелом; mobile menu открывается и закрывается Escape |
| Контраст проверенных текста/ссылок/sidebar/callout | Минимум A 7.40:1; B 5.87:1; C 6.25:1 |
| Production build | Успешно отдельно для каждой темы; 12 HTML-страниц |
| Link check | Для каждой темы 12 HTML / 246 внутренних URL; broken links/anchors нет |
| `npm run check:content` | Успешно |
| `npm run validate` | Успешно с начальным Editorial, exit 0 |
| Tests в validate | 29/29 pass, включая публикационные копии реальных глав |
| Astro/TypeScript | 18 файлов; 0 errors, 0 warnings, 0 hints |
| Проверки итогового authoring HTML | 4/4 pass |
| Контент и архитектура | Diff для src/content, schemas, content.css, legacy и migration map пуст |

Браузерная матрица проверяет реальные draft-главы в dev. Обычная production
сборка по-прежнему исключает их; существующие integration tests отдельно
проверили публикационную копию 22 HTML / 1402 внутренних URL.

Просмотрены скриншоты длинных глав, кода, формул, callouts, таблиц и мобильных
вариантов, а также overview contact sheets всех шести страниц каждой темы.
Browser plugin не обнаружил доступного браузера после troubleshooting;
использован локальный headless Chrome с отдельным профилем.
Скриншоты, JSON результатов и проверочные helper scripts сохранены в
игнорируемой `.tools/task5a-*`, не входят в production.

Практические ограничения Starlight:

- Единого публичного token для serif prose отдельно от sans UI нет:
  нужен узкий селектор content wrapper.
- Обёртка anchor heading требует отдельного правила для отступов/линий.
  Это единственная зависимость design layer от обёртки заголовка Starlight.
- Длинный заголовок сайта на mobile штатно обрезается в шапке, чтобы оставить
  место поиску и меню. Глобальный header в этой задаче не перестраивался.
- Главная остаётся минимальной исходной страницей. Её малая наполненность
  не позволяет оценивать окончательную композицию будущего landing page.
- Штатный draft banner визуально заметен во всех темах, но в опубликованной
  главе его не будет.
- Растровые изображения с мелкими подписями всё ещё требуют zoom на телефоне;
  это ограничение исходных assets, не причина увеличивать их поверх колонки.
- Проверенные contrast ratios относятся к указанным выборкам элементов;
  это не заявление о полном независимом accessibility-аудите.

Оставшиеся сообщения окружения:

- Прежние предупреждения о пустых notes/i18n.
- KaTeX strict warnings об исходных Unicode-символах и переносах в legacy;
  содержание формул не редактировалось.
- npm audit сообщает об одной **high** уязвимости существующей транзитивной
  `http-cache-semantics` ([advisory](https://github.com/advisories/GHSA-ch52-4w7c-c8xp)).
  Она не внесена font packages; lockfile изменился только добавлением шести
  Fontsource. Автоматическое обновление сторонних библиотек не запускалось.
- Git предупреждает о будущей LF/CRLF-нормализации в Windows; UTF-8 сохранён.

## Файлы

Созданы:

- `src/styles/design.css` — единственная точка выбора.
- `src/styles/themes/editorial.css`.
- `src/styles/themes/technical.css`.
- `src/styles/themes/research.css`.
- `src/styles/themes/shared.css`.
- `src/styles/themes/fonts/source-serif-4.css`.
- `src/styles/themes/fonts/source-sans-3.css`.
- `src/styles/themes/fonts/jetbrains-mono.css`.
- `src/styles/themes/fonts/ibm-plex-serif.css`.
- `src/styles/themes/fonts/ibm-plex-sans.css`.
- `src/styles/themes/fonts/ibm-plex-mono.css`.
- Этот отчёт: `design/task-5a-report.md`.

Изменены: `astro.config.mjs` — добавлен один CSS entrypoint;
`package.json` и `package-lock.json` — шесть font dependencies;
`README.md` — краткая инструкция переключения.

Учебный Markdown, assets, модели контента, course manifests, компоненты и
маршруты не менялись. Реальные курсы не переносились.
Для полного отключения exploration достаточно убрать
`'./src/styles/design.css'` из customCss; authoring primitives сохранятся.

## Рекомендация для выбора

Предпочтительный кандидат — **Editorial**: крупный serif текст, спокойная тёплая
подложка и более свободная вертикальная ритмика лучше соответствуют длительному
чтению авторского учебника. Рекомендую выбирать по linear-models и preprocessing,
сравнивая несколько экранов текста, формул и кода.

Technical полезен, если важнее компактность и быстрое возвращение к нужному
фрагменту. Research даёт более выраженный академический характер и аккуратную
структуру таблиц/разделов, но его separators заметнее во время непрерывного чтения.

Editorial в entrypoint — стартовое состояние сравнения, а не зафиксированный
выбор дизайна. Остальные темы не удалены и равноценно доступны.
