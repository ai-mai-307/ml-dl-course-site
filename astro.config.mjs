// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://ai-mai-307.github.io',
  base: '/ml-dl-course-site',
  output: 'static',
  trailingSlash: 'always',
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
      // The default 404 canonical uses /404/ even though static output is 404.html.
      disable404Route: true,
      locales: {
        root: { label: 'Русский', lang: 'ru' },
      },
      sidebar: [
        { label: 'Учебник', slug: 'textbook' },
        { label: 'Курсы', link: '/courses/' },
        { label: 'Инструкции', slug: 'guides' },
      ],
    }),
  ],
});
