// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { satteri } from '@astrojs/markdown-satteri';
import { obsidianCallouts } from './src/plugins/obsidian-callouts.ts';
import { youtubePreviews } from './src/plugins/youtube.ts';
import { math } from './src/plugins/math.ts';
import { codeLanguage } from './src/plugins/code-language.ts';

const siteBase = '/ml-dl-course-site';

export default defineConfig({
  site: 'https://ai-mai-307.github.io',
  base: siteBase,
  output: 'static',
  trailingSlash: 'always',
  image: { service: { entrypoint: './src/utils/image-service.ts' } },
  markdown: {
    processor: satteri({
      features: {
        math: true,
        // Parse the generated KaTeX HTML into elements, also when compiling MDX.
        rawHtml: true,
        smartPunctuation: false,
        gfm: { footnotes: { label: 'Сноски', backLabel: 'Вернуться к ссылке {reference}' } },
      },
      mdastPlugins: [youtubePreviews(siteBase), obsidianCallouts, math],
      hastPlugins: [codeLanguage],
    }),
  },
  vite: {
    server: {
      watch: {
        ignored: ['**/.venv/**', '**/.tools/**', '**/site/**'],
      },
    },
  },
  integrations: [
    starlight({
      title: 'Введение в машинное и глубокое обучение',
      routeMiddleware: './src/utils/textbook-sidebar.ts',
      customCss: ['katex/dist/katex.min.css', './src/styles/content.css', './src/styles/design.css'],
      // The default 404 canonical uses /404/ even though static output is 404.html.
      disable404Route: true,
      locales: {
        root: { label: 'Русский', lang: 'ru' },
      },
      sidebar: [
        { label: 'Учебник', items: [
          { label: 'Обзор учебника', link: '/textbook/' },
          { label: 'Машинное обучение', items: [{ autogenerate: { directory: 'textbook/ml' } }] },
          { label: 'Глубокое обучение', items: [{ autogenerate: { directory: 'textbook/dl' } }] },
        ] },
        { label: 'Курсы', link: '/courses/' },
        { label: 'Инструкции', items: [
          { label: 'Обзор инструкций', slug: 'guides' },
          { label: 'GitHub Classroom — архив', slug: 'guides/github-classroom' },
          { label: 'DataSphere — требует обновления', items: [
            { slug: 'guides/datasphere/clone-repository' },
            { slug: 'guides/datasphere/commit-and-push' },
            { slug: 'guides/datasphere/datasets' },
            { slug: 'guides/datasphere/budget' },
          ] },
        ] },
        { label: 'Заметки', link: '/notes/' },
        { label: 'Обо мне', slug: 'about' },
        ...(process.env.NODE_ENV === 'development'
          ? [{ label: 'Пример оформления', slug: 'guides/authoring-example' }]
          : []),
      ],
    }),
  ],
});
