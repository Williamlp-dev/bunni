import { t, type Static } from "elysia"
import { UserBasicSchema } from "@/modules/users/user.model"

export const LastMessageSchema = t.Object({
  id: t.String({ format: "uuid" }),
  content: t.String(),
  type: t.Union([t.Literal("text"), t.Literal("audio"), t.Literal("image")]),
  senderId: t.String({ format: "uuid" }),
  createdAt: t.Date(),
})

export type LastMessage = Static<typeof LastMessageSchema>

export const ConversationSchema = t.Object({
  id: t.String({ format: "uuid" }),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  participants: t.Array(UserBasicSchema),
  lastMessage: t.Union([LastMessageSchema, t.Null()]),
  unreadCount: t.Integer({ minimum: 0 }),
})

export type Conversation = Static<typeof ConversationSchema>

export const ConversationsResponseSchema = t.Object({
  conversations: t.Array(ConversationSchema),
})

export type ConversationsResponse = Static<typeof ConversationsResponseSchema>

export const ConversationResponseSchema = t.Object({
  conversation: ConversationSchema,
})

export type ConversationResponse = Static<typeof ConversationResponseSchema>
