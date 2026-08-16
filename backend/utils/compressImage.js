import sharp from "sharp";

// -----------------------------------------------------------------------
export async function compressImageBuffer(
  buffer,
  { maxDimension = 1000, quality = 80 } = {}
) {
  return sharp(buffer)
    .rotate() // auto-orient using EXIF (phone photos are often sideways), then strips EXIF
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true, // never upscale a small image
    })
    .webp({ quality })
    .toBuffer();
}