import { t, type Static } from "elysia"

export const MAX_AUDIO_DURATION_SECONDS = 120

export type AllowedContentType =
  | "audio/webm"
  | "audio/mp4"
  | "image/jpeg"
  | "image/png"
  | "image/webp"

export const PresignedUrlBodySchema = t.Object({
  contentType: t.Union([
    t.Literal("audio/webm"),
    t.Literal("audio/mp4"),
    t.Literal("image/jpeg"),
    t.Literal("image/png"),
    t.Literal("image/webp"),
  ]),
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
