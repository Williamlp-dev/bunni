import { t, type Static } from "elysia"

export const UUIDParamSchema = t.Object({
  id: t.String({ format: "uuid" }),
})

export const ConversationIdParamSchema = t.Object({
  conversationId: t.String({ format: "uuid" }),
})

export const MessageIdParamSchema = t.Object({
  messageId: t.String({ format: "uuid" }),
})

export const PaginationQuerySchema = t.Object({
  after: t.Optional(t.String({ format: "uuid" })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 50 })),
})

export type PaginationQuery = Static<typeof PaginationQuerySchema>

export const ErrorResponseSchema = t.Object({
  error: t.String(),
  code: t.String(),
})

export type ErrorResponse = Static<typeof ErrorResponseSchema>

export const SuccessResponseSchema = t.Object({
  success: t.Literal(true),
})
