# Markdown YouTube preview

Работа выполнена в ветке `site-v2`. Публичные маршруты не изменились;
legacy-сайт и theme-файлы не изменялись. Учебный текст, реальные Notes и
незавершённые авторские правки сохранены.

## Авторский синтаксис

```md
> [!YOUTUBE]
> https://www.youtube.com/watch?v=M7lc1UVf-VE
```

Необязательная подпись: `> [!YOUTUBE] Название видео`.
Внутри блока допускается обычная Markdown-ссылка; используется её href.
Без подписи выводится «Видео на YouTube». Название удалённо не запрашивается:
нет API key, oEmbed или зависимости сборки от доступности YouTube.

Поддерживаются HTTPS URL:

- `https://youtu.be/VIDEO_ID`;
- `https://www.youtube.com/watch?v=VIDEO_ID`;
- тот же watch URL на `youtube.com` и `m.youtube.com`.

Video ID извлекается автоматически и проверяется как 11 символов.
Параметры sharing сохраняются в исходной ссылке. Параметры start time и playlist
не переносятся в player. Shorts, arbitrary embed URL, HTTP, посторонние hosts,
credentials и некорректные ID не преобразуются. Блок с дополнительной прозой
или несколькими URL остаётся обычным Obsidian callout. Обычные callouts,
экранированные маркеры и fenced code не изменяются.

## Отображение, загрузка и доступность

Satteri mdast plugin выполняется перед общим Obsidian callout plugin и создаёт
статическую карточку: native button, lazy thumbnail, подпись и обычную ссылку.
CSS использует существующие design tokens, включая Research Brown light/dark.
Авторы продолжают редактировать `.md`; raw HTML в исходнике не нужен.

JavaScript: **1 648 байт исходного модуля, 791 байт gzip, 620 байт Brotli**.
Это размеры файла/локального сжатия; реальная передача зависит от сервера.
Новых dependencies и React/Vue runtime нет. Страница без embed не запрашивает
этот модуль. Несколько embed на странице используют один module URL и одну
загрузку. Файл копируется в production как обычный public asset.

Thumbnail загружается с `i.ytimg.com` через native `loading="lazy"`.
До click / Enter / Space iframe отсутствует и нет запроса player или iframe API.
Custom element включает кнопку после загрузки модуля. Native keyboard activation
создаёт iframe, переводит в него фокус и сохраняет контейнер 16:9.

Player использует `youtube-nocookie.com`, `autoplay=1`, `playsinline=1` и
`strict-origin-when-cross-origin`. Privacy-enhanced host и необходимость
Referer описаны в [официальной справке YouTube](https://support.google.com/youtube/answer/171780?hl=en).
Прямой iframe и его параметры описаны в
[YouTube Player Parameters](https://developers.google.com/youtube/player_parameters).

Кнопка имеет aria-label и заметный focus-visible. При ошибке thumbnail
картинка скрывается, кнопка и ссылка остаются. При ошибке iframe обычная ссылка
на YouTube остаётся вне заменяемой области. Без JavaScript кнопка disabled,
но исходная ссылка работает. Ошибки cross-origin player не пытаемся угадывать:
удалённое видео или запрет embedding могут потребовать открытия исходной ссылки.

## Проверки

- Новые source/browser tests: **6/6 passed**, browser test реально выполнен в Chrome.
- URL allowlist, invalid URL, escaping, обычные callouts и MDX compatibility проверены.
- Реальные click / Enter / Space, focus-visible, отсутствие iframe до взаимодействия,
  появление после, один module request для двух embed, offline и no-JS fallback проверены.
- Production output tests в isolated authoring fixture: **5/5 passed**, включая
  YouTube в обычных Markdown docs и Notes. Test fixtures не попадают в авторский контент.
- `npm run check`: **0 errors / 0 warnings / 0 hints**, 20 файлов; content sync успешен.
- Production build: **passed**, 42 страницы, Pagefind индексирует 42 страницы.
- `npm run check:links`: **passed**, 42 HTML и 2 368 внутренних URL.
- Development example: 1440/390 px × light/dark проверены в настоящем Chrome;
  thumbnail загрузился во всех четырёх вариантах, переполнения нет, 16:9 сохранён,
  player до взаимодействия не запрашивается.

`npm run validate` запущен, но завершился ошибкой: **34/38 source tests passed**.
Четыре прежние проверки не соответствуют текущим авторским материалам:
source preservation и количество callout baseline migration, SHA неизменённой
главы migration audit, ожидание пустой программы deep-learning.

Остальные проверки запущены отдельно, поскольку validate останавливается на первом
неуспешном шаге. `npm run check:authoring`: **14/17 passed**. Три прежние проверки
ожидают пустую программу курса, прежний заголовок главной и пустые Notes/placeholder
About; в рабочем контенте они уже заполнены. Эти проверки не ослаблялись ради
YouTube, авторский контент не откатывался. Полный validate пока не зелёный.

Production build сохраняет существующие предупреждения KaTeX о Unicode/math
и предупреждение о пустой служебной i18n collection; ошибок YouTube нет.
Git diff check в изменениях этой задачи чистый; общий diff также содержит
trailing whitespace в текущих авторских overview/computer-vision правках.

## Файлы

Созданы:

- `src/plugins/youtube.ts`;
- `public/scripts/youtube-preview.js`;
- `tests/youtube.test.mjs`;
- `tests/youtube-browser.test.mjs`;
- `tests/helpers/chrome.mjs`;
- этот отчёт.

Изменены:

- `astro.config.mjs` — подключён plugin, общий base для script URL;
- `src/plugins/obsidian-callouts.ts` — экспортирован существующий splitHeader;
- `src/styles/content.css` — стили карточки;
- `src/content/docs/guides/authoring-example/index.md` — один test embed, страница остаётся draft;
- `package.json` — новые tests добавлены в npm test;
- `tests/built-authoring.test.mjs` — проверка реального output docs/Notes и изоляция Notes fixtures;
- `AUTHORING.md`, `ARCHITECTURE.md` — syntax, runtime и fallback.

Остальные изменения в рабочей копии относятся к авторской работе и не входят в
эту задачу. В частности, изменение title в astro.config.mjs не было частью
реализации YouTube. Реальные главы и Notes тестовым видео не дополнялись.

## Локальный просмотр

Сейчас dev запущен на:

http://127.0.0.1:4325/ml-dl-course-site/guides/authoring-example/

При обычном `npm run dev` адрес по умолчанию:

http://localhost:4321/ml-dl-course-site/guides/authoring-example/

Страница служебная и draft: в production build она отсутствует.
