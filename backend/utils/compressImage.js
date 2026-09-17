import sharp from "sharp";
import convert from "heic-convert";

// -----------------------------------------------------------------------
// HEIC/HEIF (iPhone photos) ko pehle JPEG buffer me convert karta hai —
// zyada tar hosted `sharp`/libvips builds me native HEIF decode support
// nahi hota (licensing issues ki wajah se), isliye pure-JS `heic-convert`
// se pehle normalize karte hain. Baaki sab formats seedha sharp handle
// kar leta hai, is step ko skip karke.
async function normalizeToSupportedBuffer(buffer, fileExtension) {
  const ext = fileExtension?.toLowerCase().replace(".", "");

  if (ext === "heic" || ext === "heif") {
    const jpegBuffer = await convert({
      buffer,
      format: "JPEG",
      quality: 0.9, // high rakha hai yaha — asli compression neeche sharp karega
    });
    return { buffer: jpegBuffer, ext: "jpg" };
  }

  return { buffer, ext };
}

// -----------------------------------------------------------------------
// Compresses + resizes an image buffer. Accepts jpg/jpeg, png, webp,
// avif, heic, heif as input. Returns { buffer, outputExt } — outputExt
// tells the caller what extension/mime-type to actually save/upload as
// (important for heic/heif, jinka output ab hamesha jpg hota hai).
export async function compressImageBuffer(
  buffer,
  fileExtension = "jpg",
  { maxDimension = 1000, quality = 80 } = {}
) {
  const { buffer: normalizedBuffer, ext: normalizedExt } =
    await normalizeToSupportedBuffer(buffer, fileExtension);

  let pipeline = sharp(normalizedBuffer)
    .rotate() // auto-orient using EXIF (phone photos are often sideways)
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true, // never upscale a small image
    });

  const ext = normalizedExt;

  // Format ke hisab se compression apply karein
  if (ext === "png") {
    pipeline = pipeline.png({ compressionLevel: 8 });
  } else if (ext === "webp") {
    pipeline = pipeline.webp({ quality });
  } else if (ext === "avif") {
    pipeline = pipeline.avif({ quality });
  } else {
    // jpg / jpeg / heic-converted / baki formats ke liye
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  const outputBuffer = await pipeline.toBuffer();

  return {
    buffer: outputBuffer,
    outputExt: ["png", "webp", "avif"].includes(ext) ? ext : "jpg",
  };
}