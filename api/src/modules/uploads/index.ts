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
      detail: {
        tags: ["Uploads"],
        summary: "Gerar URL de upload",
        description: "Gera uma URL pré-assinada temporária no Cloudflare R2 para upload direto de arquivos de mídia (imagens e áudios). A URL gerada é válida por um período limitado e permite que o cliente faça o upload diretamente ao storage sem passar pelo servidor. Após o upload, use a key retornada para associar o arquivo à mensagem ou perfil.",
      },
    }
  )
