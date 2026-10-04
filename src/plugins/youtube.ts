import { defineMdastPlugin, type MdastNode } from 'satteri';
import { splitHeader } from './obsidian-callouts.ts';

/** Only supported HTTPS video URLs; never interpolate an arbitrary host into an embed. */
export function parseYouTubeUrl(value: string) {
  let url: URL;
  try { url = new URL(value.trim()); } catch { return undefined; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return undefined;
  let id: string | null | undefined;
  if (url.hostname === 'youtu.be') id = /^\/([\w-]{11})\/?$/.exec(url.pathname)?.[1];
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname) && url.pathname === '/watch') {
    if (url.searchParams.getAll('v').length !== 1) return undefined;
    id = url.searchParams.get('v');
  }
  if (!id || !/^[\w-]{11}$/.test(id)) return undefined;
  return { id, href: url.href };
}

function plainText(node: MdastNode): string {
  if ('value' in node) return String(node.value);
  if ('children' in node) return node.children.map(plainText).join('');
  return '';
}
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

/** The module is referenced only by Markdown that actually contains a valid embed. */
export function youtubePreviews(base: string) {
  const script = escapeHtml(base.replace(/\/$/, '') + '/scripts/youtube-preview.js');
  return defineMdastPlugin({
    name: 'youtube-previews',
    options: { position: true },
    blockquote(node, context) {
      if (node.data?.hName) return;
      const paragraph = node.children[0];
      if (paragraph?.type !== 'paragraph') return;
      const first = paragraph.children[0];
      if (first?.type !== 'text') return;
      const marker = /^\[!YOUTUBE\](?:[ \t]+|(?=\n|$))/i.exec(first.value);
      if (!marker || (first.position && context.source[first.position.start.offset!] === '\\')) return;
      const { title, body } = splitHeader(paragraph.children, marker[0].length);
      const content = node.children.slice(1);
      if (body.length) content.unshift({ type: 'paragraph', children: body });
      // Do not discard prose/lists or guess between multiple links. Invalid blocks stay callouts.
      if (content.length !== 1 || content[0]?.type !== 'paragraph') return;
      const parts = content[0].children.filter((child) => child.type !== 'break' && !(child.type === 'text' && !child.value.trim()));
      if (parts.length !== 1) return;
      const source = parts[0];
      const href = source.type === 'link' ? source.url : source.type === 'text' ? source.value : '';
      const video = parseYouTubeUrl(href);
      if (!video) return;
      const linkTitle = source.type === 'link' ? plainText(source).trim() : '';
      const caption = title.map(plainText).join('').trim() || (linkTitle && !/^https?:/i.test(linkTitle) ? linkTitle : 'Видео на YouTube');
      const name = escapeHtml(caption);
      return {
        type: 'html' as const,
        value: `<figure class="youtube-preview">
<youtube-preview data-video-id="${video.id}" data-title="${name}">
<div class="youtube-preview__frame">
<button type="button" class="youtube-preview__poster" aria-label="Воспроизвести: ${name}" disabled>
<img src="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async">
<span class="youtube-preview__play" aria-hidden="true">▶</span>
</button>
</div>
</youtube-preview>
<figcaption><span class="youtube-preview__caption">${name}</span> <a href="${escapeHtml(video.href)}">Смотреть на YouTube</a></figcaption>
</figure>
<script type="module" src="${script}"></script>`,
      };
    },
  });
}
