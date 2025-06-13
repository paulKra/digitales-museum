// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx()],
  site: "https://paulKra.github.io",
  base: "/digitales-museum/",
  vite: {
    plugins: [tailwindcss()],
  },
});
