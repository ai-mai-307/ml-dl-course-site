import { defineHastPlugin } from 'satteri';

// Satteri and Expressive Code use this extension on fenced code elements.
declare module 'hast' {
  interface ElementData { lang?: string; }
}

// rawHtml rebuilds HAST and drops code.data.lang. Expressive Code currently reads
// that field, while Satteri keeps the original fence language in its CSS class.
export const codeLanguage = defineHastPlugin({
  name: 'preserve-fence-language',
  element: {
    filter: ['pre'],
    visit(node) {
      const code = node.children.find((child) => child.type === 'element' && child.tagName === 'code');
      if (!code || code.type !== 'element' || code.data?.lang) return;
      const classes = code.properties.className;
      const language = (Array.isArray(classes) ? classes : String(classes ?? '').split(' '))
        .find((value) => typeof value === 'string' && value.startsWith('language-'));
      if (!language) return;
      return {
        ...node,
        children: node.children.map((child) => child === code
          ? { ...code, data: { ...code.data, lang: language.slice('language-'.length) } }
          : child),
      };
    },
  },
});
