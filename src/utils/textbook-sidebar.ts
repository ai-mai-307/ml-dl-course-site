import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';

type Item = StarlightRouteData['sidebar'][number];

// Page-local index.md/assets folders otherwise produce redundant one-link groups.
// Keep Starlight's generated links, order, active state and native draft filtering.
function compact(item: Item): Item {
  if (item.type === 'link') return item;
  const entries = item.entries.map(compact);
  if (entries.length === 1 && entries[0]!.type === 'link') return entries[0]!;
  return { ...item, entries };
}

export const onRequest = defineRouteMiddleware(({ locals }) => {
  locals.starlightRoute.sidebar = locals.starlightRoute.sidebar.map((item) => {
    if (item.type !== 'group' || item.label !== 'Учебник') return item;
    return {
      ...item,
      entries: item.entries.map((section) => section.type === 'group'
        ? { ...section, entries: section.entries.map(compact) }
        : section),
    };
  });
});
