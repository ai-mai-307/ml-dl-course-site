# Task 7 — three real Fall 2026 course shells

Ветка: site-v2. Добавлены три публичных курса осени 2026 без заранее заданной программы.

| Course ID | Название | Аудитория |
| --- | --- | --- |
| deep-learning | Глубокое машинное обучение | Магистры групп 226СВ и 238СВ |
| ai-design | Технологии ИИ в конструировании | Магистры группы 111СВ |
| intro-ml-dl-pish | Введение в машинное и глубокое обучение | Студенты ПИШ |

Каждый YAML в src/content/courses/<courseId>/2026-fall.yaml содержит status: active,
draft: false, modules: [] и честное описание обновления материалов в течение семестра.
Текущая схема collections совместима: её менять не потребовалось.

Для каждого курса созданы пять public docs в src/content/docs/courses/<courseId>/2026-fall/:
overview.md, assessment.md, schedule.md, exam.md, resources.md. Все используют
contentKind: reference, собственные courseId/termId, draft: false и точное предупреждение
«Информация обновляется» первым элементом тела Markdown. Только overview дополнительно
показывает известные аудиторию и семестр. Страницы имеют ссылку обратно к курсу.

Пять ссылок в pages — Content Collection references. Существующая resolveCourse
проверяет наличие документов и запрещает публичным страницам ссылки на draft docs;
эта проверка сохранена и протестирована реальными build failures в изолированном проекте.

Exam назван «Итоговая аттестация»; организационная роль exam отображается как
«Аттестация». Название файла не утверждает конкретную форму аттестации.
Система оценивания, даты, аудитории занятий, дедлайны, формат/вопросы экзамена,
внешние ресурсы и последовательность тем не добавлены. Учебник не копировался в курс.

## Интерфейс и authoring

/courses/ показывает ровно три курса, название, аудиторию, статус и «Осень 2026».
Страница курса разделяет организационные страницы и учебную программу; modules: []
отображает сообщение о добавлении материалов по ходу семестра. Темы и CSS не менялись.

Добавлен src/content/_templates/course-page.md: title, description, contentKind: reference,
courseId, termId, draft: true. Он содержит только frontmatter. AUTHORING.md описывает
использование шаблона, заполнение идентификаторов и публикацию документа перед добавлением
в pages публичного manifest. ARCHITECTURE.md фиксирует три shell-курса и пустую программу.

## Удаление demo и тесты

После успешной сборки новых курсов, проверки типов и четырёх HTML-тестов удалены
только src/content/courses/ml/2026-fall.yaml и его четыре exclusive docs:
overview.md, assessment.md, exam.md, assignments/hw-03.md.
Git guide и authoring example сохранены draft.

Данные, необходимые для проверки нумерации, ресурсов, пользовательских slug и ошибок ссылок,
хранятся только в tests/fixtures/course-docs/ и course-preprocessing.yaml.
Seed helper создаёт их в изолированных копиях, без зависимости от рабочего demo content.
Обновлены course-build, drafts и только соответствующая fixture-часть migration test.
Исторические проверки текста и хэшей учебника не ослаблены.

Development integration проверяет реальные collection metadata, все три курса и
15 документов, типизированные references, пустые modules и новый Obsidian template.
Production-тест tests/built-course-shells.test.mjs проверяет индекс, аудитории,
активные курсы, empty state, все организационные ссылки, первые warnings и удаление demo.
Он включён в npm run check:authoring и полный validate через package.json.
Dependencies и package-lock не менялись.

## Маршруты и сохранность

Новые маршруты: /courses/<courseId>/2026-fall/ и пять страниц /<role>/ для каждого курса.
Изменён только ранее публичный индекс /courses/; legacy public routes не перенесены
и не изменены. Удалённый demo и его docs были draft и не имели публичных production URL.
Поэтому migration/route-map.csv не менялся; redirects или cutover не нужны для этого шага.

Legacy docs, MkDocs config, requirements, workflows, guides, темы, schema и lockfile
не изменены. В рабочем дереве присутствуют параллельные авторские правки
textbook/ml/introduction и textbook/dl/neural-network-foundations; Task 7 их не редактировал.

## Проверки и ограничения

- npm run validate запущен: tests **29/32**, затем команда остановилась.
- Все course/schema/draft tests прошли, включая dev проверки трёх настоящих курсов
  и всех организационных страниц, production rejection draft references и новый template.
- Три старых проверки учебника не прошли: baseline source preservation
  (первое отличие в introduction); fence audit/hash unchanged chapters
  (первое отличие в introduction); baseline rendered callout count (13 вместо 11).
  Эти отличия относятся к авторским правкам учебника вне Task 7.
  Текст, миграционные hashes и ожидаемое историческое число callouts не переписывались.
- Оставшиеся этапы validate выполнены отдельно: npm run check — 18 файлов,
  0 errors / 0 warnings / 0 hints; content sync прошёл.
- npm run build — success, **39 страниц**, все 18 новых страниц в output
  и Pagefind search index.
- npm run check:links — **39 HTML / 2111 внутренних URL**, нет битых ссылок/якорей.
- npm run check:authoring — **12/12**.
- Production preview в локальном Chrome: три курса и все 15 документов при
  1440/390 px и light/dark (**72 проверки страниц**, плюс индекс в четырёх сочетаниях).
  Проверены аудитории, warning, empty state и отсутствие горизонтального overflow.
  Просмотрены screenshots desktop/dark индекса и mobile/light курса ПИШ.
  Временные результаты в игнорируемых .tools/task7-browser-results.json и .tools/task7-*.png.

Полный validate не является успешным: исторический migration audit учебника требует
отдельного согласования с авторскими редакциями. Сохраняются предупреждения о пустых
notes/i18n и KaTeX Unicode в исходном учебном контенте.

## Локальный просмотр

Работающий production preview:

- [Курсы](http://127.0.0.1:4326/ml-dl-course-site/courses/)
- [Глубокое машинное обучение](http://127.0.0.1:4326/ml-dl-course-site/courses/deep-learning/2026-fall/)
- [Технологии ИИ в конструировании](http://127.0.0.1:4326/ml-dl-course-site/courses/ai-design/2026-fall/)
- [Введение в машинное и глубокое обучение](http://127.0.0.1:4326/ml-dl-course-site/courses/intro-ml-dl-pish/2026-fall/)

Development: npm run dev. Production preview: npm run build, затем npm run preview.
Открыть адрес Astro с префиксом /ml-dl-course-site/.
После Task 7 работа остановлена. Deployment не выполнялся.
