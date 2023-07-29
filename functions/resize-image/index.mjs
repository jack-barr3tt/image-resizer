import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { v4 as uuid } from "uuid"

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
})

export const handler = async (event) => {
  const { id, width, height, preserveRatio } = JSON.parse(event.body)

  const getCommand = new GetObjectCommand({
    Bucket: "image-resizer-jb",
    Key: id,
  })

  const data = await s3Client.send(getCommand)

  const resized = await sharp(await data.Body.transformToByteArray())
    .resize({
      width,
      height,
      fit: preserveRatio ? "cover" : "fill",
      // withoutEnlargement: true,
    })
    .toBuffer()

  const newID = uuid()

  const upload = new PutObjectCommand({
    Bucket: "image-resizer-jb",
    Key: newID,
    Body: resized,
  })

  await s3Client.send(upload)

  return {
    statusCode: 200,
    body: JSON.stringify({
      id: newID,
      mode: preserveRatio ? "cover" : "fill",
    }),
  }
}
