/** Shared by custom collection lists and routes; Starlight handles docs itself. */
export function isVisible(entry: { data: { draft?: boolean } }, development: boolean) {
  return development || entry.data.draft !== true;
}
