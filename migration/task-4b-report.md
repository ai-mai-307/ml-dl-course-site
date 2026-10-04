# Task 4B — baseline миграции учебника

> Исторический отчёт. В Task 4C preprocessing объединён в одну главу;
> экспериментальные подстраницы удалены, а подсветка Python исправлена.
> Актуальное состояние: [отчёт Task 4C](task-4c-report.md).

Ветка: `site-v2`. Перенесены девять оставшихся теоретических конспектов,
каждый — в одну крупную тематическую Markdown-страницу. Все реальные главы
сохраняют `draft: true`. Раздел preprocessing из Task 4 сохранён как обзор
и шесть самостоятельных тем. Редакторская декомпозиция и Task 5 не выполнялись.

## Состав и маршруты

Пути в таблице указаны без общего префикса `/ml-dl-course-site`.
Файл каждой новой главы: `src/content/docs<новый маршрут>index.md`.

| Legacy-файл | Старый URL | Canonical textbook route | Изображений |
| --- | --- | --- | ---: |
| `docs/ml/lecture_01.md` | `/ml/lecture_01/` | `/textbook/ml/introduction/` | 2 |
| `docs/ml/lecture_03.md` | `/ml/lecture_03/` | `/textbook/ml/linear-models/` | 9 |
| `docs/ml/lecture_04.md` | `/ml/lecture_04/` | `/textbook/ml/trees-and-ensembles/` | 1 |
| `docs/ml/lecture_05.md` | `/ml/lecture_05/` | `/textbook/ml/clustering-and-dimensionality-reduction/` | 0 |
| `docs/dl/lecture_01.md` | `/dl/lecture_01/` | `/textbook/dl/neural-network-foundations/` | 4 |
| `docs/dl/lecture_02.md` | `/dl/lecture_02/` | `/textbook/dl/computer-vision/` | 14 |
| `docs/dl/lecture_03.md` | `/dl/lecture_03/` | `/textbook/dl/audio/` | 0 |
| `docs/dl/lecture_04.md` | `/dl/lecture_04/` | `/textbook/dl/sequences-and-text/` | 16 |
| `docs/dl/lecture_05.md` | `/dl/lecture_05/` | `/textbook/dl/large-language-models/` | 12 |
| **Итого Task 4B** | | **9 крупных глав** | **58** |

Введение и линейные модели заменяют существовавшие v2-заглушки с теми же URL.
Остальные семь глав добавлены. Обзор `/textbook/` сохраняет прежний URL,
но теперь генерируется в `src/pages/textbook/index.astro`.

Существующие маршруты Task 4 не менялись:

- `/textbook/ml/preprocessing/`;
- `/textbook/ml/preprocessing/scaling/`;
- `/textbook/ml/preprocessing/categorical-features/`;
- `/textbook/ml/preprocessing/temporal-features/`;
- `/textbook/ml/preprocessing/outliers/`;
- `/textbook/ml/preprocessing/missing-values/`;
- `/textbook/ml/preprocessing/sklearn-api/`.

[route-map.csv](route-map.csv) содержит прежние семь строк для lecture_02 и
девять новых однозначных соответствий со статусом `migrated-draft`.
Redirects, GitHub Pages cutover и удаление старых URL не реализованы.

## Сохранность источников

Текст девяти страниц проверяется целиком, а не только по нескольким цитатам:
тест последовательно применяет записанные технические изменения к legacy-файлу
и сравнивает весь результат с телом нового Markdown. SHA-256 исходных файлов
и точные пары before/after хранятся в
[task-4b-manifest.json](task-4b-manifest.json).

Сохранены порядок объяснений, примеры, формулы, списки, таблица, внешние ссылки,
подписи и изображения. H2–H6 остаются внутренними разделами крупных глав.
В девяти новых источниках нет fenced code blocks; существующие Python-примеры
preprocessing отдельно проверены в тестах Task 4 и браузере.

Текст и изображения preprocessing не менялись. Единственная доработка его
семи страниц — `sidebar.order` в frontmatter для логичного порядка навигации.
Хеши тел этих страниц сохранены и проверяются тестом.

`git diff --name-only -- docs mkdocs.yml requirements.txt .github/workflows`
пуст: legacy-конспекты, их изображения, MkDocs-конфигурация, зависимости и
workflow публикации не изменены.

## Изображения

Скопированы только 58 локальных файлов, реально используемых девятью главами.
Каждый хранится в `assets/` рядом со своей `index.md`; ссылки имеют вид
`![исходный alt](./assets/исходное-имя.png)`.
Все копии побайтово совпадают с legacy. Неиспользуемые legacy-файлы не удалены.

**Переименований нет.** Исходные числовые имена и alt сохранены как исключение
для baseline. 54 alt представляют собой числовые ID; остальные четыре —
имена файлов. Содержательные alt и окончательные имена требуют отдельной
редакторской проверки, а не автоматически придуманной интерпретации.

Полный перечень всех 58 соответствий old path → new path, alt и SHA-256:
[task-4b-assets.csv](task-4b-assets.csv).

Три GIF находятся в `computer-vision/assets/`:

- `conv1.gif`;
- `moving_average.gif`;
- `max_average_pooling.gif`.

Astro по умолчанию преобразовывал их в WebP. Небольшой сервис
`src/utils/image-service.ts` использует публичный
[Image Service API](https://docs.astro.build/en/reference/image-service-reference/)
и стандартный Sharp для остальных форматов; GIF возвращаются исходными байтами
и с форматом GIF. Тест проверяет не только source-копии, но и три файла,
на которые ссылается собранный HTML. Клиентский JavaScript не добавлен.

Размеры отдельных картинок и CSS для отдельных файлов не настраивались.
Использованы штатные responsive-правила Starlight. Проверено отсутствие выхода
из content area и сохранение aspect ratio в desktop/narrow, light/dark.

## Технические преобразования Markdown

1. Добавлены frontmatter `title`, `contentKind: textbook`, `draft: true`,
   `sidebar.label` и `sidebar.order`. Исторические `courseId`/`termId` не назначены.
   Заголовки страниц взяты из legacy-названий в MkDocs/самих конспектов; номера
   лекций не превращены в номера глав.
2. Три начальных H1 перенесены в frontmatter. В computer-vision вторичный H1
   «Список использованных источников» стал H2, чтобы у страницы был один H1.
   Остальные уровни и последовательность заголовков сохранены.
3. 11 MkDocs admonitions преобразованы в утверждённые Obsidian callouts:
   introduction — 1; linear-models — 1; trees-and-ensembles — 2;
   neural-network-foundations — 1; computer-vision — 4; audio — 1;
   sequences-and-text — 1. Сохранены заголовки, вложенные цитаты, списки,
   формулы и изображения; несколько пустых строк внутри блока не обрывают его.
4. В introduction определение после `!!! quote` было без необходимого отступа.
   Этот соседний абзац включён в callout как его тело. В linear-models лишняя
   кавычка заголовка `""Вспомним комбинаторику"` сохранена в отображаемом тексте.
5. 58 путей изображений заменены на page-local относительные пути.
6. В clustering-and-dimensionality-reduction ссылка на тот же PCA-видеоролик
   получила отсутствовавший протокол: `youtube.com/...` → `https://www.youtube.com/...`.
7. Там же восемь записей показателя степени `^\*` заменены на `^*`:
   исходная команда не поддерживается KaTeX. Математическая звёздочка сохранена;
   остальная формула не менялась. Изменение явно записано в manifest.

Не вводились MDX, raw HTML для оформления, новые научные пояснения или зависимости.

## Внутренние и временные legacy-ссылки

В девяти исходниках не обнаружены ссылки на другие legacy-лекции или на
неперенесённые course/assignment/guide-страницы.
**Временных legacy-ссылок в новых главах нет.**
Все внешние ссылки сохранены, кроме добавления протокола одной PCA-ссылке.
Проверка ссылок проверяет локальные маршруты, файлы и якоря; доступность
внешних сайтов не проверялась.

## Замеченные дефекты источника, оставленные для автора

Это перечень наблюдений, а не проведённая научная редактура:

- ML introduction, строка 26: `Perfomance`; MkDocs quote с неотступленным телом
  технически преобразован, формулировка определения не переписана.
- ML linear-models, строка 67: лишнее `j=` в формуле линейной модели;
  строки 475/512: `Accuray`/`Precisoin`; дополнительная кавычка в комбинаторном
  callout. Эти ошибки сохранены.
- ML trees-and-ensembles, строка 183: в примере для сравнения критериев дважды
  указано одинаковое распределение `[0.6, 0.4]`, но утверждается различие
  энтропии/Джини. Требует проверки автором; пример не исправлен.
- ML clustering, строки 162/317: `Алгомеративный`, `яджерная`;
  соседние разделы «Шаги алгоритма» и «Шаги алгоритма (агломеративная версия)»
  сохранены. Несовместимый TeX escape звёздочки адаптирован только синтаксически.
- DL computer-vision, строки 25/51/124/128: `Огромное количестве`,
  `стот задача`, `обазом`, `небольшной`. Не исправлены.
- DL audio, строка 46: кириллическая `с` в математическом обозначении скорости;
  в заголовке «Получение эмбеддингов с помощью автоэкнодера» сохранена опечатка.
- DL sequences-and-text, строка 167: `фиксированного количество`,
  `справо`, `лова`. Не исправлены.
- DL large-language-models: исходные заголовки «2. Attention и self-attention»
  и «2.1 Что такое attention?» остались без редакторской перенумерации.
- В исходниках есть невидимые U+200B, U+2061, неразрывные пробелы и кириллица
  в math. Например: ML trees, строки 67/68/91; ML linear-models, строки 572/646.
  KaTeX выдаёт strict-mode предупреждения; символы не вычищены молча.
- Для neural-network-foundations отдельный явный дефект в рамках механического
  просмотра не зафиксирован. Это не утверждение о научной корректности всей главы.
- Числовые alt и растровые изображения псевдокода оставлены как в источнике.

## Изображения для последующей ручной редакции

Файлы ниже находятся в `assets/` соответствующей главы. Это рекомендации
по просмотренным исходникам/скриншотам; сейчас они не масштабированы вручную.

| Глава | Кандидаты | Причина |
| --- | --- | --- |
| linear-models | `176173396747.png`, `1761739449828.png` | Псевдокод в растровых снимках; мелкий текст на узком экране. Позднее рассмотреть текстовые code blocks. |
| linear-models | `1761738215863.png` | Узкая высокая инфографика метрик; мелкие подписи. |
| linear-models | `1761738601138.png` | Схема регуляризации с бледными плотными обозначениями. |
| neural-network-foundations | `1757586632357.png` | Шесть графиков активаций в одном изображении; подписи требуют увеличения на телефоне. |
| computer-vision | `1760385006768.png`, `1760385020070.png`, `1760385311681.png` | Плотные подписи в схемах свёрток и pooling; рассмотреть более читаемые исходники. |
| sequences-and-text | `1771166754314.png`–`1771166803231.png` (пять BPE-снимков по CSV) | Растровый текст; позднее рассмотреть представление примера обычным текстом. |
| sequences-and-text | `1771166988743.png`, `1771167027841.png`, `1771167320867.png` | Бледные подписи one-hot/матриц/Word2Vec, особенно при уменьшении. |
| sequences-and-text | `1771167685303.png`, `1771169304528.png` | Детальные схемы LSTM/GRU и высокая Seq2Seq-схема; проверить размер/детализацию при редактуре. |
| large-language-models | `1771171320883.png`, `1771171752653.png`, `1771177511837.png` | Много мелких обозначений в архитектуре и этапах обучения. |

У introduction и trees-and-ensembles дополнительных индивидуальных кандидатов
по выполненному просмотру не отмечено; общая проблема числовых alt сохраняется.
В audio и clustering нет переносимых иллюстраций.

## Future splitting candidates

Фактического разбиения этих девяти глав не выполнялось.

| Крупная глава | Естественные будущие границы |
| --- | --- |
| introduction | Определение и парадигмы ML; процесс решения задачи; данные и их качество. |
| linear-models | Линейная регрессия и функции потерь; оптимизация/SGD; обобщение и регуляризация; линейная классификация и логистическая регрессия; метрики и многоклассовые схемы. |
| trees-and-ensembles | Построение деревьев и критерии; работа с признаками/пропусками; bias–variance; bagging/random forest; gradient boosting. |
| clustering-and-dimensionality-reduction | Постановка обучения без учителя; K-means; иерархическая кластеризация; DBSCAN; проклятие размерности; SVD/PCA; t-SNE/UMAP. |
| neural-network-foundations | Персептрон/XOR; прямой проход/MLP; backpropagation; функции активации; инициализация. |
| computer-vision | Свёртка и классические фильтры; свёрточный слой/параметры/receptive field; pooling; аугментации; классификация/детекция/сегментация. |
| audio | Физика и оцифровка/WAV; Fourier/FFT/STFT и спектральные признаки; задачи обработки аудио; поиск похожих треков и автоэнкодер. |
| sequences-and-text | Типы последовательностей и задач; токенизация/BPE; эмбеддинги и частотные методы; Word2Vec; RNN; LSTM/GRU; Seq2Seq. |
| large-language-models | Языковое моделирование; attention/self-attention; transformer/позиционное кодирование; encoder-only/decoder-only; параметры/генерация; pretraining/SFT/PEFT/предпочтения; prompting. |

## Навигация и draft workflow

Обзор учебника показывает две группы с пятью тематическими главами в каждой.
Preprocessing представлен одним разделом, его обзор ведёт к существующим шести темам.

Ссылки обзора фильтруются по `draft` и режиму Astro. Документные маршруты,
draft-предупреждения, сортировка и исключение из production-sidebar остаются
штатными механизмами Starlight. Небольшой middleware через публичный
[route-data API](https://starlight.astro.build/guides/route-data/) убирает
из автогенерации только избыточные одноэлементные группы папок учебника.
Родительские ML/DL-группы сохранены, preprocessing имеет русскую метку и обзор
перед подразделами. Нумерация глав не привязана к лекциям или модулям курса.

Production не публикует девять новых глав и семь страниц preprocessing,
не включает ссылки на них в обзор, навигацию и sitemap. Demo course остаётся
draft и не перестраивается. Опубликованные организационные заглушки курса
независимы от draft-флага его манифеста, как и прежде.

## Изменённые файлы

- Девять `index.md` глав (два заменяют заглушки), 58 page-local assets.
- Семь frontmatter preprocessing: только `sidebar.order`.
- `src/pages/textbook/index.astro`, `src/utils/textbook.ts`,
  `src/utils/textbook-sidebar.ts`, `src/utils/image-service.ts`,
  `astro.config.mjs`.
- Удалён v2-placeholder `src/content/docs/textbook/index.md`, вместо него
  обзор по прежнему URL генерируется Astro-страницей.
- `migration/route-map.csv`, этот отчёт, JSON manifest и CSV assets.
- `tests/baseline-migration.test.mjs`, `tests/built-migration.test.mjs`,
  test-only `tests/fixtures/docs/{introduction,linear-models}.md`,
  `tests/helpers/course-docs.mjs`; адаптированы course-build/drafts/migration
  integration tests. Их изолированные копии получают опубликованные test-only
  документы, чтобы замена настоящих заглушек на draft-главы не меняла сценарии
  проверки публичных курсов. Рабочие course manifests не изменены.
- `package.json`: baseline-тест добавлен в существующий `npm test`.
- `AUTHORING.md` и `README.md`: актуальный baseline, GIF и правила навигации.
- Локальные проверочные скрипты/скриншоты лежат в игнорируемой `.tools/`;
  пользовательские Obsidian-настройки не создавались.

## Проверки

| Проверка | Результат |
| --- | --- |
| `npm test` | 27/27 pass; включает прежние тесты и baseline source/assets/rendering regression. |
| `npm run check` | Astro TypeScript/content/schema checks: 0 ошибок, 0 предупреждений, 0 hints. |
| `npm run build` | Production build успешно, 12 страниц; реальные drafts отсутствуют. |
| `npm run check:links` | 12 HTML, 246 внутренних URL; broken links/anchors нет. |
| `npm run check:authoring` | 4/4 pass; итоговый HTML и исключение всех реальных drafts. |
| `npm run validate` | Полный существующий pipeline завершён успешно. |
| Изолированная публикационная копия drafts | 28 HTML, 1753 внутренних URL; 983 MathML-формулы, 58 изображений, 11 callouts, 1 таблица в девяти новых главах. Все H2–H6 присутствуют. Три GIF совпадают с оригиналами побайтово. |
| Визуальная проверка | 7 страниц × 1440/390 px × light/dark = 28 сочетаний; загружены изображения, aspect ratio сохранён, page/content overflow отсутствует, KaTeX/overlay errors отсутствуют. |
| Навигация | 10 упорядоченных ссылок в обзоре, фактический переход по ссылке; ML/DL-группы и preprocessing проверены. |
| Дополнительный git diff --check | Отмечает три trailing-whitespace строки в linear-models (42, 338, 339), перенесённые из источника; сохранены для точного baseline. |
| Legacy и ветка | Ветка `site-v2`; diff для legacy/MkDocs/workflow пуст. |

Визуально проверены: overview; ML linear-models и trees-and-ensembles;
DL computer-vision и sequences-and-text; preprocessing overview и sklearn-api.
Просмотрены скриншоты формул, вложенных callouts, изображений, таблицы и кода,
а также контактные листы всех 58 иллюстраций. Встроенный Browser был недоступен
(пустой список браузеров после troubleshooting), использован локальный headless
Chrome; скриншоты и метрики сохранены в `.tools/task4b-*`.

Оставшиеся предупреждения/ограничения:

- Пустые коллекции notes/i18n: прежние предупреждения Astro/Starlight.
- KaTeX strict-mode сообщает о кириллице, невидимых/неразрывных Unicode-символах
  и `\\` вне выравнивающего окружения; они сохранены из источника.
  Неопределённых команд, обрыва рендеринга глав и ошибок типов после адаптации нет.
- Python-примеры preprocessing сохраняют текст и отступы, скроллятся внутри
  code block, но рендерер помечает их `plaintext`; это ограничение, уже отмеченное
  в отчёте Task 4. В Task 4B конфигурация подсветки не переделывалась.
- Мелкий текст некоторых растровых схем на телефоне требует увеличения;
  кандидаты перечислены выше.
- git diff --check отмечает три исходные строки с конечными пробелами;
  они сохранены, включая формулы, вместо массовой очистки Markdown.
  Git также предупреждает о нормализации LF/CRLF в Windows (UTF-8 сохранён).
- Внешние URL не проверялись на сетевую доступность.

## Локальный просмотр

Из корня репозитория:

```sh
npm run dev
```

Обычный URL: <http://localhost:4321/ml-dl-course-site/textbook/>.
Все девять ссылок главы находятся в обзоре; черновики доступны именно в dev.
`npm run preview` показывает production-сборку без этих черновиков.

Для выполненной проверки сервер запущен на
<http://127.0.0.1:4325/ml-dl-course-site/textbook/>.
Для повторного запуска этого адреса:

```sh
npm run dev -- --host 127.0.0.1 --port 4325
```

Страницы для ручного просмотра:

- [Обзор](http://127.0.0.1:4325/ml-dl-course-site/textbook/).
- [Линейные модели: формулы, метрики, таблица](http://127.0.0.1:4325/ml-dl-course-site/textbook/ml/linear-models/).
- [Деревья: вложенные цитаты и callouts](http://127.0.0.1:4325/ml-dl-course-site/textbook/ml/trees-and-ensembles/).
- [Компьютерное зрение: длинный callout и GIF](http://127.0.0.1:4325/ml-dl-course-site/textbook/dl/computer-vision/).
- [Последовательности: BPE и схемы RNN](http://127.0.0.1:4325/ml-dl-course-site/textbook/dl/sequences-and-text/).
- [Preprocessing](http://127.0.0.1:4325/ml-dl-course-site/textbook/ml/preprocessing/).
- [Python-примеры Task 4](http://127.0.0.1:4325/ml-dl-course-site/textbook/ml/preprocessing/sklearn-api/).

При отсутствии Node в PATH используйте переносимую настройку из README.
Новые страницы следует проверять и публиковать отдельно; baseline сам по себе
не меняет их `draft` на `false`. Материалы исторических курсов не мигрированы.
