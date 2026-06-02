import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadImage(
  buffer: Buffer,
  key: string,
  contentType = "image/webp"
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
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

export function getPresignedUploadUrl(key: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: "image/*",
  });
  return getSignedUrl(r2, command, { expiresIn: 3600 });
}
