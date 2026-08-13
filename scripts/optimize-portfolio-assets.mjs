/** Converts one or more user-owned SVG exports into responsive web portfolio covers. */
import { mkdir, readFile } from "node:fs/promises";
import sharp from "sharp";

const outputDirectory = "apps/web/public/images/projects";
const widths = [640, 960, 1440];
const inputs = process.argv.slice(2);

if (inputs.length === 0 || inputs.length % 2 !== 0) {
  throw new Error("Usage: pnpm assets:portfolio -- <source.svg> <output-slug> [source.svg output-slug ...]");
}

const sources = [];
for (let index = 0; index < inputs.length; index += 2) {
  const path = inputs[index];
  const name = inputs[index + 1];
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Invalid output slug: ${name}`);
  sources.push({ path, name });
}

await mkdir(outputDirectory, { recursive: true });

for (const source of sources) {
  const svg = await readFile(source.path);
  for (const width of widths) {
    const image = sharp(svg, { density: 144 }).resize({ width });
    await image.clone().avif({ quality: 62, effort: 5 }).toFile(`${outputDirectory}/${source.name}-${width}.avif`);
    await image.clone().webp({ quality: 80, effort: 5 }).toFile(`${outputDirectory}/${source.name}-${width}.webp`);
  }
}
