import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const REGION = process.env.S3_REGION ?? 'eu-north-1'
const BUCKET_NAME = process.env.S3_BUCKET_NAME!

const client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.S3_PUBLIC_ACCES_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params
  const fullKey = `uploads/${key}`

  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fullKey }),
    )

    const body = await response.Body!.transformToByteArray()

    return new NextResponse(body, {
      headers: {
        'Content-Type': response.ContentType ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
}
