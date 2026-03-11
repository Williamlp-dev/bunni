import { t, type Static } from "elysia"
import { UserBasicSchema } from "@/modules/users/user.model"
import { MessageSchema } from "@/modules/messages/message.model"

export const ParticipantSchema = t.Object({
  id: t.String({ format: "uuid" }),
  conversationId: t.String({ format: "uuid" }),
  userId: t.String({ format: "uuid" }),
  joinedAt: t.String({ format: "date-time" }),
  user: UserBasicSchema,
})

export type Participant = Static<typeof ParticipantSchema>

export const ConversationSchema = t.Object({
  id: t.String({ format: "uuid" }),
  createdAt: t.String({ format: "date-time" }),
  participants: t.Array(ParticipantSchema),
  lastMessage: t.Union([MessageSchema, t.Null()]),
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
