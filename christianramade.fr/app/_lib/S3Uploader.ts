import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"

const REGION = process.env.S3_REGION ?? "eu-west-3"
const BUCKET_NAME = process.env.S3_BUCKET_NAME!
const ACCESS_KEY = process.env.S3_PUBLIC_ACCES_KEY!
const SECRET_KEY = process.env.S3_SECRET_KEY!

function getS3Client(): S3Client {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
    },
  })
}

/**
 * Vérifie que le bucket S3 existe, le crée si nécessaire.
 */
export async function ensureBucketExists(): Promise<void> {
  const client = getS3Client()
  try {
    await client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }))
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name
    if (name === "NotFound" || name === "NoSuchBucket") {
      await client.send(
        new CreateBucketCommand({
          Bucket: BUCKET_NAME,
          CreateBucketConfiguration: {
            LocationConstraint: REGION as never,
          },
        }),
      )
    } else {
      throw err
    }
  }
}

function generateKey(fileName: string): string {
  const timestamp = Date.now()
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-")
  return `uploads/${timestamp}-${safeName}`
}

/**
 * Upload un fichier vers S3 et retourne l'URL publique.
 */
export async function uploadFileToS3(
  file: File,
): Promise<{ url: string; key: string }> {
  const client = getS3Client()
  const key = generateKey(file.name)
  const body = Buffer.from(await file.arrayBuffer())

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: file.type || "application/octet-stream",
    }),
  )

  const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`
  return { url, key }
}

/**
 * Upload un buffer optimisé vers S3 avec une clé dérivée du nom de base.
 * Ex : `uploads/1234567890-photo.webp` et `uploads/1234567890-photo-small.webp`.
 */
export async function uploadOptimizedBuffer(
  buffer: Buffer,
  baseKey: string,
  suffix: string,
  contentType: string,
): Promise<{ url: string; key: string }> {
  const client = getS3Client()
  const key = `${baseKey}${suffix ? `-${suffix}` : ""}.webp`

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`
  return { url, key }
}

/**
 * Supprime un objet de S3 via sa clé.
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  const client = getS3Client()
  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  )
}

/**
 * Télécharge un objet S3 et retourne son buffer + content-type.
 */
export async function downloadFileFromS3(
  key: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const client = getS3Client()
  const response = await client.send(
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
  )
  const bytes = await response.Body!.transformToByteArray()
  return {
    buffer: Buffer.from(bytes),
    contentType: response.ContentType ?? "image/jpeg",
  }
}