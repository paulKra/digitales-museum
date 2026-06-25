import fs from "fs-extra";
import path from "path";
import matter from "gray-matter";
import { glob } from "glob";

const CONTENT_DIR = path.join(process.cwd(), "src/assets/content");
const OUTPUT_DIR = path.join(process.cwd(), "src/assets/generated");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "points.json");

async function transform() {
    console.log("Transforming MDX files...");

    try {
        // Ensure output directory exists
        await fs.ensureDir(OUTPUT_DIR);

        // Find all .mdx files
        const files = await glob("**/*.mdx", { cwd: CONTENT_DIR });
        console.log(`Found ${files.length} MDX files.`);

        const points = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(CONTENT_DIR, file);
                const content = await fs.readFile(filePath, "utf-8");
                const { data, content: markdown } = matter(content);

                // Basic validation and cleaning
                if (!data.lat || !data.lon) {
                    console.warn(`Warning: File ${file} is missing lat/lon. Skipping.`);
                    return null;
                }

                // Clean up markdown (remove Astro imports)
                const cleanedMarkdown = markdown
                    .replace(/^import .* from ".*";\r?\n/gm, "")
                    .replace(/<Image\s+[^>]*\/>/g, "") // Remove Image tags for now until we handle them
                    .trim();

                return {
                    id: data.number || file.replace(".mdx", ""),
                    title: data.title || "Untitled",
                    lat: Number(data.lat),
                    lon: Number(data.lon),
                    author: data.author || "Unknown",
                    description: data.description || "",
                    content: cleanedMarkdown,
                    model3d: data.model3d,
                };
            })
        );

        const validPoints = points.filter((p) => p !== null);

        await fs.writeJson(OUTPUT_FILE, validPoints, { spaces: 2 });
        console.log(`Successfully generated ${validPoints.length} points at ${OUTPUT_FILE}`);
    } catch (error) {
        console.error("Error transforming MDX files:", error);
        process.exit(1);
    }
}

transform();
