import { AwsClient } from "aws4fetch"
import { env } from "@/env"
import type { PresignedUrlBody, PresignedUrlResponse } from "@/modules/uploads/upload.model"
import { MAX_AUDIO_DURATION_SECONDS } from "@/modules/uploads/upload.model"

export class UploadServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "AUDIO_TOO_LONG" | "INVALID_CONTENT_TYPE"
  ) {
    super(message)
    this.name = "UploadServiceError"
  }
}

const r2Client = new AwsClient({
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
})

function resolveSubfolder(contentType: string): { subfolder: string; extension: string } {
  if (contentType.startsWith("audio/")) {
    const extension = contentType === "audio/webm" ? "webm" : "mp4"
    return { subfolder: "audios", extension }
  }
  if (contentType.startsWith("image/")) {
    const extensionMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    }
    return { subfolder: "images", extension: extensionMap[contentType] ?? "jpg" }
  }
  throw new UploadServiceError(`Unsupported content type: ${contentType}`, "INVALID_CONTENT_TYPE")
}

export async function generatePresignedUrl(
  userId: string,
  body: PresignedUrlBody
): Promise<PresignedUrlResponse> {
  const { contentType, conversationId, audioDuration } = body

  if (audioDuration && audioDuration > MAX_AUDIO_DURATION_SECONDS) {
    throw new UploadServiceError(
      `Audio duration exceeds ${MAX_AUDIO_DURATION_SECONDS}s limit`,
      "AUDIO_TOO_LONG"
    )
  }

  const { subfolder, extension } = resolveSubfolder(contentType)
  const key = `${conversationId}/${subfolder}/${userId}-${Date.now()}.${extension}`

  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`
  )
  url.searchParams.set("X-Amz-Expires", "3600")

  const signed = await r2Client.sign(new Request(url, { method: "PUT" }), {
    aws: { signQuery: true },
  })

  return {
    uploadUrl: signed.url,
    publicUrl: `${env.R2_PUBLIC_DOMAIN}/${key}`,
    key,
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`
  )

  await r2Client.fetch(url.toString(), { method: "DELETE" })
}
