import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema({
    extend: ({ image }) =>
      z.object({
        contentKind: z
          .enum(['textbook', 'guide', 'assignment', 'exam', 'reference'])
          .default('textbook'),

        updatedAt: z.coerce.date().optional(),
        tags: z.array(z.string()).default([]),

        // Used only for course-specific Markdown pages.
        courseId: z.string().optional(),
        termId: z.string().optional(),

        // Optional author-controlled ordering where filesystem/sidebar order
        // is not enough.
        order: z.number().int().nonnegative().optional(),

        coverImage: image().optional(),
        coverAlt: z.string().optional(),

        // Optional metadata used by Obsidian attachment-renaming workflows.
        // It has no required visual meaning on the website.
        imageNameKey: z.string().optional(),
      }),
  }),
});

const resourceRoleSchema = z.enum([
  'theory',
  'assignment',
  'guide',
  'slides',
  'notebook',
  'repository',
  'exam',
  'competition',
  'other',
]);

const courseResourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('doc'),
    role: resourceRoleSchema,
    doc: reference('docs'),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal('link'),
    role: resourceRoleSchema,
    label: z.string(),
    href: z.string().url(),
  }),
]);

const courses = defineCollection({
  loader: glob({
    pattern: '**/*.{yaml,yml}',
    base: './src/content/courses',
  }),
  schema: z.object({
    courseId: z.string().regex(/^[a-z0-9-]+$/),
    termId: z.string().regex(/^\d{4}-(spring|summer|fall|winter)$/),

    title: z.string(),
    shortTitle: z.string().optional(),
    description: z.string(),

    status: z.enum(['draft', 'active', 'completed', 'archived']),
    language: z.string().default('ru'),

    institution: z.string().optional(),
    audience: z.string().optional(),

    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),

    instructors: z
      .array(
        z.object({
          name: z.string(),
          role: z.string().optional(),
          url: z.string().url().optional(),
        }),
      )
      .default([]),

    schedule: z
      .object({
        summary: z.string(),
        location: z.string().optional(),
      })
      .optional(),

    modules: z
      .array(
        z.object({
          number: z.number().int().positive(),
          title: z.string(),
          description: z.string().optional(),
          published: z.boolean().default(true),
          resources: z.array(courseResourceSchema).default([]),
        }),
      )
      .default([]),
  }),
});

const notes = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/notes',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),

      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),

      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),

      coverImage: image().optional(),
      coverAlt: z.string().optional(),
    }),
});

export const collections = {
  docs,
  courses,
  notes,
};
