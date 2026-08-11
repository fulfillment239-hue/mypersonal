/** Creates responsive, non-upscaled hero variants from the user-supplied PNG. */
import sharp from "sharp";

const source = "apps/web/public/images/nailong.png";
const sizes = [640, 960, 1254];

for (const width of sizes) {
  await sharp(source).resize({ width, withoutEnlargement: true }).avif({ quality: 58 }).toFile(`apps/web/public/images/nailong-${width}.avif`);
  await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 76 }).toFile(`apps/web/public/images/nailong-${width}.webp`);
}
