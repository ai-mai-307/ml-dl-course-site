# Task 6A — publish the baseline textbook

Ветка: `site-v2`. Все десять реальных глав опубликованы в production output
штатным полем Starlight `draft: false`. Deployment/cutover не выполнялся.

## Проверенный состав

| Раздел | Глава | Legacy-источник | Production URL |
| --- | --- | --- | --- |
| ML | introduction | docs/ml/lecture_01.md | /textbook/ml/introduction/ |
| ML | preprocessing | docs/ml/lecture_02.md | /textbook/ml/preprocessing/ |
| ML | linear-models | docs/ml/lecture_03.md | /textbook/ml/linear-models/ |
| ML | trees-and-ensembles | docs/ml/lecture_04.md | /textbook/ml/trees-and-ensembles/ |
| ML | clustering-and-dimensionality-reduction | docs/ml/lecture_05.md | /textbook/ml/clustering-and-dimensionality-reduction/ |
| DL | neural-network-foundations | docs/dl/lecture_01.md | /textbook/dl/neural-network-foundations/ |
| DL | computer-vision | docs/dl/lecture_02.md | /textbook/dl/computer-vision/ |
| DL | audio | docs/dl/lecture_03.md | /textbook/dl/audio/ |
| DL | sequences-and-text | docs/dl/lecture_04.md | /textbook/dl/sequences-and-text/ |
| DL | large-language-models | docs/dl/lecture_05.md | /textbook/dl/large-language-models/ |

Это перенесённые конспекты, а не заглушки: сохранность проверяется по
`task-4b-manifest.json` и `task-4c-manifest.json`. Для девяти baseline-конспектов
тест восстанавливает только ранее записанные механические преобразования и
сравнивает всё тело с legacy. Для preprocessing сохранены сравнения всех разделов,
формул, кода и источников. Изображения сверяются побайтово, включая три GIF.

В каждом из десяти `src/content/docs/textbook/{ml,dl}/<chapter>/index.md`
изменена только строка `draft: true` → `draft: false`. Прямое сравнение с начальным
состоянием подтвердило отсутствие других изменений в этих файлах.
В готовых десяти страницах: 1006 MathML-формул, 71 изображение, 11 callouts,
три блока кода. Course/term ID не добавлялись.

## Остальные изменения

- `src/pages/textbook/index.astro`: обзор описывает существующий учебник из десяти
  глав. Сохраняются два раздела ML/DL и фильтрация по publication state.
- `migration/route-map.csv`: статусы десяти переходов обновлены на
  `migrated-published`. Legacy/target URL и отношения сохранены; redirects не добавлены.
- Шесть ранее публичных технических демонстрационных документов теперь имеют
  `draft: true`: Git, authoring-example, overview, assessment, exam и hw-03
  демонстрационного ML-курса. Их содержание сохранено. Манифест курса и раньше
  был draft; его publication state не изменён. Страницы доступны в development.
- `astro.config.mjs`: явный sidebar slug для authoring-example включается только
  в development. В `src/content/docs/guides/index.md` убрана публичная ссылка
  на этот draft. Это предотвращает сломанный production sidebar/ссылку.
- Обновлены существующие migration/output-тесты и изолированные course fixtures.
  Теперь они требуют опубликованные главы, проверяют все десять ссылок и в обзоре,
  и в sidebar, а также отсутствие demo-страниц в output, навигации и sitemap.
  Сравнение исторического SHA-256 девяти глав учитывает только смену draft-флага;
  исторические манифесты не перезаписывались.
- Authoring-output проверки теперь собирают пример в собственной временной копии,
  сохраняя проверки Markdown, формул, callouts, подсветки, изображения и шрифтов,
  без публикации технической демонстрации в основном `dist/`.
- README и AUTHORING получили актуальную отметку о публикации baseline;
  прежние миграционные отчёты остаются историческими.

В `src/styles/`, включая Research Brown и остальные темы, изменений нет.
Legacy `docs/`, MkDocs-конфигурация, requirements и workflows сохранены.
Главная, реальные курсы, перенос гайдов, заметки и deployment остаются следующими задачами.

## Проверки

`npm run validate` завершился с exit code 0; включает production build и link check:

- Основные tests: 29/29.
- Astro check, синхронизация контента/типов: 18 файлов, 0 ошибок, 0 warnings, 0 hints
  в результате проверки типов.
- Production build: 16 страниц, включая все десять глав; Pagefind индекс построен.
- Link check: 16 HTML, 1188 внутренних URL; битых ссылок и якорей нет.
- Готовый output и authoring: 5/5. Два теста проверяют публикацию учебника и
  скрытие demos в основном `dist/`, три — authoring в изолированной сборке.
- Сохранность baseline и preprocessing проверяется исходными миграционными тестами.

Предупреждения, оставшиеся из предыдущих задач: пустые `notes` и необязательная
`i18n`; KaTeX strict для Unicode/невидимых символов и newline в исходных формулах.
Учебное содержание и математическая нотация не исправлялись. Git также сообщает
об ожидаемой LF → CRLF нормализации файлов в Windows.

## Поиск в production preview

Проверен настоящий Pagefind UI через локальный headless Chrome/CDP.
Подключённых браузеров skill Browser не обнаружил, поэтому применён локальный fallback
с отдельным профилем. Для каждой главы проверены результат и переход на её страницу:

| Глава | Запрос |
| --- | --- |
| introduction | знакомство |
| preprocessing | нормализация |
| linear-models | линейные модели |
| trees-and-ensembles | решающие деревья |
| clustering-and-dimensionality-reduction | кластеризация |
| neural-network-foundations | персептрон |
| computer-vision | изображений |
| audio | аудиосигнала |
| sequences-and-text | последовательных |
| large-language-models | языковые модели |

Все десять переходов прошли на desktop/light. Дополнительный поиск и переход audio
прошли на 390 px в dark mode. Проверены ссылки всех десяти глав в sidebar и обзоре,
отсутствие draft-banner и переполнения документа на открытых страницах.
Дополнительно запросы через публичный Pagefind API не возвращают demo URL.
Просмотрен screenshot production-обзора с полным списком глав.
Временные скрипты, JSON и screenshots находятся в игнорируемой `.tools/task6a-*`.

## Ручной просмотр

Используется уже запущенный production preview:
[Учебник](http://127.0.0.1:4326/ml-dl-course-site/textbook/).
Отсюда все главы доступны через список и sidebar; кнопка поиска работает с production index.
К URL из таблицы выше следует добавить префикс
`http://127.0.0.1:4326/ml-dl-course-site`.

Для нового локального запуска из корня: `npm run preview` после `npm run build`.
Открыть адрес, который напечатает Astro. Для draft-примеров используется `npm run dev`.
При уже работающем preview Astro предлагает использовать существующий сервер или
остановить его перед новым запуском. Перезапуск сервера для этой проверки не потребовался.
