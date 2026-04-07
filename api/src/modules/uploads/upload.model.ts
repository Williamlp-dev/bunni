import { t, type Static } from "elysia"

export const MAX_AUDIO_DURATION_SECONDS = 120

export const AVATAR_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export type AvatarContentType = (typeof AVATAR_CONTENT_TYPES)[number]

export const PresignedUrlBodySchema = t.Object({
  contentType: t.String({
    pattern: "^(audio|image)/.+$",
    description: "MIME type (e.g., audio/ogg;codecs=opus)",
  }),
  conversationId: t.String({ format: "uuid" }),
  audioDuration: t.Optional(t.Number({ minimum: 1, maximum: MAX_AUDIO_DURATION_SECONDS })),
})

export type PresignedUrlBody = Static<typeof PresignedUrlBodySchema>

export const PresignedUrlResponseSchema = t.Object({
  uploadUrl: t.String(),
  publicUrl: t.String(),
  key: t.String(),
})

export type PresignedUrlResponse = Static<typeof PresignedUrlResponseSchema>
