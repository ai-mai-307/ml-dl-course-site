import type { CollectionEntry } from 'astro:content';

export const textbookGroups = [
  {
    label: 'Машинное обучение',
    chapters: [
      { id: 'textbook/ml/introduction', label: 'Введение в машинное обучение' },
      { id: 'textbook/ml/preprocessing', label: 'Предварительная обработка данных' },
      { id: 'textbook/ml/linear-models', label: 'Линейные модели' },
      { id: 'textbook/ml/trees-and-ensembles', label: 'Деревья и ансамбли' },
      { id: 'textbook/ml/clustering-and-dimensionality-reduction', label: 'Кластеризация и понижение размерности' },
    ],
  },
  {
    label: 'Глубокое обучение',
    chapters: [
      { id: 'textbook/dl/neural-network-foundations', label: 'Основы нейронных сетей' },
      { id: 'textbook/dl/computer-vision', label: 'Компьютерное зрение' },
      { id: 'textbook/dl/audio', label: 'Обработка аудио' },
      { id: 'textbook/dl/sequences-and-text', label: 'Последовательности и текст' },
      { id: 'textbook/dl/large-language-models', label: 'Трансформеры / большие языковые модели' },
    ],
  },
] as const;

// This custom overview lists only routes Starlight can publish in the current mode.
// Document routes, sidebar filtering and draft banners remain owned by Starlight.
export function textbookSections(docs: CollectionEntry<'docs'>[], development: boolean) {
  const visible = new Set(docs.filter((doc) => development || !doc.data.draft).map((doc) => doc.id));
  return textbookGroups.map((group) => ({
    label: group.label,
    chapters: group.chapters.filter((chapter) => visible.has(chapter.id)),
  }));
}
