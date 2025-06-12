import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders"; // Not available with legacy API

const band1 = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/locations/band1" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lat: z.number(),
    lon: z.number(),
    date: z.date(),
  }),
});

export const collections = { band1 };
