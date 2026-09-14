import sharp from "sharp";

// -----------------------------------------------------------------------
export async function compressImageBuffer(
  buffer,
  fileExtension = "jpg",
  { maxDimension = 1000, quality = 80 } = {}
) {
  let pipeline = sharp(buffer)
    .rotate() // auto-orient using EXIF (phone photos are often sideways)
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true, // never upscale a small image
    });

  const ext = fileExtension?.toLowerCase().replace(".", "");

  // Format ke hisab se compression apply karein
  if (ext === "png") {
    pipeline = pipeline.png({ compressionLevel: 8 });
  } else if (ext === "webp") {
    pipeline = pipeline.webp({ quality });
  } else if (ext === "avif") {
    pipeline = pipeline.avif({ quality });
  } else {
    // jpg / jpeg ya baki formats ke liye
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  return pipeline.toBuffer();
}