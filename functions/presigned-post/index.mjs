import { createPresignedPost } from "@aws-sdk/s3-presigned-post"
import { S3Client } from "@aws-sdk/client-s3"
import { v4 as uuid } from "uuid"

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
})

export const handler = async (event) => {
  const id = uuid()
  try {
    return {
      statusCode: 200,
      body: await createPresignedPost(s3Client, {
        Bucket: "image-resizer-jb",
        Key: id,
        Fields: {
          key: id,
        },
        Conditions: [
          ["starts-with", "$Content-Type", "image/"],
          ["content-length-range", 0, 1000000],
        ],
      }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: error,
    }
  }
}
