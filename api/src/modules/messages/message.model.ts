import { t, type Static } from "elysia"
import { UserBasicSchema } from "@/modules/users/user.model"

export const MessageTypeEnum = t.Union([t.Literal("text"), t.Literal("audio"), t.Literal("image")])

export const SendMessageBodySchema = t.Object({
  content: t.String({ maxLength: 4000 }),
  type: t.Optional(MessageTypeEnum),
  audioUrl: t.Optional(t.String()),
  audioDuration: t.Optional(t.Number({ minimum: 1, maximum: 120 })),
  imageUrl: t.Optional(t.String()),
  replyToId: t.Optional(t.String({ format: "uuid" })),
})

export type SendMessageBody = Static<typeof SendMessageBodySchema>

export const MessageReplySchema = t.Object({
  id: t.String({ format: "uuid" }),
  content: t.String(),
  senderName: t.String(),
  deletedAt: t.Union([t.String(), t.Null()]),
})

export type MessageReply = Static<typeof MessageReplySchema>

export const MessageSchema = t.Object({
  id: t.String({ format: "uuid" }),
  conversationId: t.String({ format: "uuid" }),
  senderId: t.String({ format: "uuid" }),
  content: t.String(),
  type: t.String(),
  audioUrl: t.Union([t.String(), t.Null()]),
  audioDuration: t.Union([t.Number(), t.Null()]),
  imageUrl: t.Union([t.String(), t.Null()]),
  createdAt: t.Date(),
  deletedAt: t.Union([t.Date(), t.Null()]),
  sender: UserBasicSchema,
  replyTo: t.Union([MessageReplySchema, t.Null()]),
})

export type Message = Static<typeof MessageSchema>

export const MessagesResponseSchema = t.Object({
  messages: t.Array(MessageSchema),
  hasMore: t.Boolean(),
  nextCursor: t.Union([t.String({ format: "uuid" }), t.Null()]),
})

export type MessagesResponse = Static<typeof MessagesResponseSchema>

export const BatchMessageIdsSchema = t.Object({
  messageIds: t.Array(t.String({ format: "uuid" }), { minItems: 1, maxItems: 50 }),
})

export type BatchMessageIds = Static<typeof BatchMessageIdsSchema>

export const BatchDeleteResponseSchema = t.Object({
  deletedCount: t.Number(),
})

export type BatchDeleteResponse = Static<typeof BatchDeleteResponseSchema>


