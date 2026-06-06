import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

// MinIO is S3-compatible. It requires path-style addressing
// (bucket in the URL path, not the host) and a concrete region.
const s3 = new S3Client({
  region: process.env.MINIO_REGION ?? "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT!, // e.g. http://localhost:9000
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
});

export async function uploadImage(
  buffer: Buffer,
  key: string,
  contentType = "image/webp"
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${process.env.MINIO_PUBLIC_URL}/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.MINIO_BUCKET!,
      Key: key,
    })
  );
}

// Resize and convert image to WebP, returns [thumb, medium, large] URLs
export async function processAndUploadImage(
  inputBuffer: Buffer,
  basePath: string // e.g. "products/abc123"
): Promise<{ thumb: string; medium: string; large: string }> {
  const sizes = [
    { name: "thumb", width: 200, height: 200 },
    { name: "medium", width: 400, height: 400 },
    { name: "large", width: 800, height: 800 },
  ];

  const results: Record<string, string> = {};

  await Promise.all(
    sizes.map(async ({ name, width, height }) => {
      const resized = await sharp(inputBuffer)
        .resize(width, height, { fit: "cover", position: "center" })
        .webp({ quality: 85 })
        .toBuffer();

      const key = `${basePath}/${name}.webp`;
      results[name] = await uploadImage(resized, key);
    })
  );

  return results as { thumb: string; medium: string; large: string };
}

// Wide promotional banners: keep the artwork's aspect ratio (no square crop),
// just downscale to a sensible max width and convert to WebP. Returns one URL.
export async function processAndUploadBanner(
  inputBuffer: Buffer,
  basePath: string // e.g. "banners/abc123"
): Promise<{ url: string }> {
  const resized = await sharp(inputBuffer)
    .resize(1200, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const url = await uploadImage(resized, `${basePath}/banner.webp`);
  return { url };
}

export function getPresignedUploadUrl(key: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET!,
    Key: key,
    ContentType: "image/*",
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
