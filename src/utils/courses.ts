import type { CollectionEntry } from 'astro:content';

type Course = CollectionEntry<'courses'>;
type Doc = CollectionEntry<'docs'>;
type Resource = Course['data']['modules'][number]['resources'][number];
type CoursePage = Course['data']['pages'][number];
type DocReference = Extract<Resource, { type: 'doc' }>['doc'];

export const statusLabels: Record<Course['data']['status'], string> = {
  draft: 'Черновик', active: 'Идёт обучение', completed: 'Завершён', archived: 'Архив',
};

export const roleLabels: Record<Resource['role'], string> = {
  theory: 'Теория', assignment: 'Задания', guide: 'Инструкции',
  notebook: 'Ноутбуки', slides: 'Слайды', repository: 'Репозитории',
  exam: 'Экзамен', competition: 'Соревнования', other: 'Другие материалы',
};

export const pageRoleLabels: Record<CoursePage['role'], string> = {
  overview: 'Обзор курса', assessment: 'Оценивание', exam: 'Аттестация',
  schedule: 'Расписание', policy: 'Правила курса', resources: 'Общие ресурсы', other: 'Другое',
};

function sitePath(base: string, id: string) {
  const prefix = base.replace(/\/$/, '');
  const path = id.normalize().split('/').filter(Boolean).map(encodeURIComponent).join('/');
  return `${prefix}/${path}${path ? '/' : ''}`;
}

export function courseUrl(course: Course, base: string) {
  return sitePath(base, `courses/${course.data.courseId}/${course.data.termId}`);
}

export function termLabel(term: string) {
  const [year, season] = term.split('-');
  const seasons: Record<string, string> = {
    spring: 'Весна', summer: 'Лето', fall: 'Осень', winter: 'Зима',
  };
  return `${seasons[season]} ${year}`;
}

/** Resolve every reference before filtering unpublished modules. Do not copy document bodies. */
export async function resolveCourse(
  course: Course,
  getDoc: (reference: DocReference) => Promise<Doc | undefined>,
  base: string,
  development = false,
) {
  const { data } = course;
  const expectedId = `${data.courseId}/${data.termId}`;
  if (course.id !== expectedId) {
    throw new Error(`Course manifest "${course.id}": expected path "${expectedId}.yaml" to match courseId/termId.`);
  }
  async function resolveDoc(reference: DocReference, label: string | undefined, context: string, visible = true) {
    const doc = await getDoc(reference);
    if (!doc) throw new Error(`${context}: missing docs reference "${reference.id}".`);
    if (!development && visible && doc.data.draft) {
      throw new Error(`${context}: docs reference "${doc.id}" is a draft and has no production page.`);
    }
    // Starlight's public routes follow collection IDs, including custom slugs.
    const id = doc.id.replace(/(^|\/)index$/, '');
    return { label: label ?? doc.data.title, href: sitePath(base, id) };
  }
  const pages = await Promise.all(data.pages.map(async (page, index) => ({
    role: page.role,
    ...await resolveDoc(page.doc, page.label, `Course manifest "${course.id}", page ${index + 1} (${page.role})`),
  })));
  const modules = await Promise.all(data.modules.map(async (module, index) => {
    // Use the manifest position, including unpublished modules. Labels never affect anchors.
    const position = index + 1;
    const resources = await Promise.all(module.resources.map(async (resource) => {
      if (resource.type === 'link') return resource;
      return {
        type: resource.type,
        role: resource.role,
        ...await resolveDoc(resource.doc, resource.label, `Course manifest "${course.id}", module ${position}`, module.published),
      };
    }));
    const groups = (Object.keys(roleLabels) as Resource['role'][])
      .map((role) => ({ role, label: roleLabels[role], resources: resources.filter((item) => item.role === role) }))
      .filter((group) => group.resources.length > 0);
    return {
      position, label: module.label ?? String(position), title: module.title,
      description: module.description, published: module.published, groups,
    };
  }));
  return { ...data, pages, modules: modules.filter((module) => module.published) };
}

export type ResolvedCourse = Awaited<ReturnType<typeof resolveCourse>>;
