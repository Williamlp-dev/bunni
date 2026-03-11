import { Elysia } from "elysia"
import { authMacro } from "@/plugins/better-auth"
import * as UploadService from "@/modules/uploads/upload.service"
import { UploadServiceError } from "@/modules/uploads/upload.service"
import { PresignedUrlBodySchema } from "@/modules/uploads/upload.model"

export const uploadsRoutes = new Elysia({ prefix: "/uploads" })
  .use(authMacro)
  .onError(({ error, set }) => {
    if (error instanceof UploadServiceError) {
      const statusMap: Record<UploadServiceError["code"], number> = {
        AUDIO_TOO_LONG: 400,
        INVALID_CONTENT_TYPE: 400,
      }
      set.status = statusMap[error.code] ?? 400
      return { error: error.message, code: error.code }
    }
    throw error
  })
  .post(
    "/presigned-url",
    async ({ user, body }) => {
      return await UploadService.generatePresignedUrl(user.id, body)
    },
    {
      auth: true,
      body: PresignedUrlBodySchema,
      detail: { tags: ["Uploads"], description: "Generate presigned URL for R2 upload" },
    }
  )
