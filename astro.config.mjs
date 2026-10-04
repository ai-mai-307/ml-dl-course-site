// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { satteri } from '@astrojs/markdown-satteri';
import { obsidianCallouts } from './src/plugins/obsidian-callouts.ts';
import { math } from './src/plugins/math.ts';

export default defineConfig({
  site: 'https://ai-mai-307.github.io',
  base: '/ml-dl-course-site',
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
      mdastPlugins: [obsidianCallouts, math],
    }),
  },
  vite: {
    server: {
      watch: {
        ignored: ['**/.venv/**', '**/.tools/**', '**/site-v2-starter/**', '**/site/**'],
      },
    },
  },
  integrations: [
    starlight({
      title: 'Машинное и глубокое обучение',
      routeMiddleware: './src/utils/textbook-sidebar.ts',
      customCss: ['katex/dist/katex.min.css', './src/styles/content.css'],
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
        { label: 'Инструкции', slug: 'guides' },
        { label: 'Заметки', link: '/notes/' },
        { label: 'Пример оформления', slug: 'guides/authoring-example' },
      ],
    }),
  ],
});
