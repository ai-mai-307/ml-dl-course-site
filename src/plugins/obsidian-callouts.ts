import { defineMdastPlugin, type MdastNode } from 'satteri';

// Satteri supports these public mdast-to-hast overrides at runtime.
declare module 'mdast' {
  interface Data {
    hName?: string;
    hProperties?: Record<string, string | string[] | boolean>;
  }
}

type Paragraph = Extract<MdastNode, { type: 'paragraph' }>;
type InlineNode = Paragraph['children'][number];

const kinds: Record<string, [string, string]> = {
  note: ['note', 'Заметка'],
  abstract: ['note', 'Кратко'], summary: ['note', 'Кратко'], tldr: ['note', 'Кратко'],
  info: ['note', 'Информация'], todo: ['note', 'К выполнению'],
  tip: ['tip', 'Совет'], hint: ['tip', 'Совет'], important: ['tip', 'Важно'],
  success: ['tip', 'Успех'], check: ['tip', 'Успех'], done: ['tip', 'Готово'],
  question: ['caution', 'Вопрос'], help: ['caution', 'Помощь'], faq: ['caution', 'Вопрос'],
  warning: ['caution', 'Предупреждение'], caution: ['caution', 'Осторожно'], attention: ['caution', 'Внимание'],
  failure: ['danger', 'Ошибка'], fail: ['danger', 'Ошибка'], missing: ['danger', 'Отсутствует'],
  danger: ['danger', 'Опасность'], error: ['danger', 'Ошибка'], bug: ['danger', 'Ошибка'],
  example: ['note', 'Пример'], quote: ['quote', 'Цитата'], cite: ['quote', 'Цитата'],
};

// Split the title from the body without flattening links, emphasis, or math.
export function splitHeader(children: InlineNode[], markerLength: number) {
  const title: InlineNode[] = [];
  const body: InlineNode[] = [];
  let inBody = false;
  for (const [index, original] of children.entries()) {
    const child = index === 0 && original.type === 'text'
      ? { ...original, value: original.value.slice(markerLength) }
      : original;
    if (!inBody && child.type === 'break') {
      inBody = true;
    } else if (!inBody && child.type === 'text' && child.value.includes('\n')) {
      const boundary = child.value.indexOf('\n');
      if (boundary > 0) title.push({ type: 'text', value: child.value.slice(0, boundary) });
      if (boundary + 1 < child.value.length) body.push({ type: 'text', value: child.value.slice(boundary + 1) });
      inBody = true;
    } else if (child.type !== 'text' || child.value) {
      (inBody ? body : title).push(child);
    }
  }
  return { title, body };
}

/** Obsidian blockquotes become static asides or keyboard-operable native details. */
export const obsidianCallouts = defineMdastPlugin({
  name: 'obsidian-callouts',
  options: { position: true },
  blockquote(node, context) {
    if (node.data?.hName) return;
    const paragraph = node.children[0];
    if (paragraph?.type !== 'paragraph') return;
    const first = paragraph.children[0];
    if (first?.type !== 'text') return;
    const marker = /^\[!([\w-]+)\]([+-])?(?:[ \t]+|(?=\n|$))/.exec(first.value);
    if (!marker) return;
    // An escaped marker is an ordinary quotation, not an instruction to this plugin.
    if (first.position && context.source[first.position.start.offset!] === '\\') return;

    const type = marker[1].toLowerCase();
    const [variant, defaultTitle] = Object.hasOwn(kinds, type) ? kinds[type] : ['note', type];
    const { title, body } = splitHeader(paragraph.children, marker[0].length);
    const content = node.children.slice(1);
    if (body.length) content.unshift({ type: 'paragraph', children: body });
    const collapsible = Boolean(marker[2]);

    return {
      type: 'blockquote',
      data: {
        hName: collapsible ? 'details' : 'aside',
        hProperties: {
          className: ['obsidian-callout', `obsidian-callout--${variant}`],
          'data-callout': type,
          ...(marker[2] === '+' ? { open: true } : {}),
        },
      },
      children: [
        {
          type: 'paragraph',
          data: {
            hName: collapsible ? 'summary' : 'p',
            hProperties: { className: ['obsidian-callout__title'] },
          },
          children: title.length ? title : [{ type: 'text', value: defaultTitle }],
        },
        ...content,
      ],
    };
  },
});
