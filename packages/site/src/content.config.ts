import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	blog: defineCollection({
		schema: ({ image }) =>
			z.object({
				title: z.string(),
				image: image().optional(),
				description: z.string().optional(),
				date: z.coerce.date(),
			}),
	}),
};
