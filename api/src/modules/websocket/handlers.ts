import { t, type Static } from "elysia"
import { Value } from "@sinclair/typebox/value"
import {
  type ElysiaWebSocket,
  broadcastToConversation,
  subscribeToConversation,
} from "./connection-manager"
import { isParticipant } from "@/modules/conversations/conversation.service"

export const subscribeSchema = t.Object({
  type: t.Literal("subscribe"),
  conversationId: t.String({ format: "uuid" }),
})

export const typingSchema = t.Object({
  type: t.Union([t.Literal("typing:start"), t.Literal("typing:stop")]),
  conversationId: t.String({ format: "uuid" }),
})

export const messageSendSchema = t.Object({
  type: t.Literal("message:send"),
  conversationId: t.String({ format: "uuid" }),
  content: t.String({ minLength: 1, maxLength: 4000 }),
})

export const webSocketMessageSchema = t.Union([
  subscribeSchema,
  typingSchema,
  messageSendSchema,
])

export type WebSocketMessage = Static<typeof webSocketMessageSchema>

export async function handleMessage(
  ws: ElysiaWebSocket,
  message: unknown
): Promise<void> {
  if (!Value.Check(webSocketMessageSchema, message)) {
    const errors = [...Value.Errors(webSocketMessageSchema, message)]
    ws.send(JSON.stringify({
      event: "error",
      data: {
        message: "Invalid message format",
        errors: errors.map(e => ({ path: e.path, message: e.message }))
      }
    }))
    return
  }

  const validMessage = message as WebSocketMessage
  const { type } = validMessage

  try {
    switch (type) {
      case "subscribe":
        await handleSubscribe(ws, validMessage)
        break
      case "typing:start":
      case "typing:stop":
        await handleTyping(ws, validMessage)
        break
      case "message:send":
        ws.send(JSON.stringify({ event: "error", data: { code: "NOT_SUPPORTED", message: "Use HTTP to send messages" } }))
        break
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    ws.send(JSON.stringify({ event: "error", data: errorMessage }))
  }
}

async function handleSubscribe(
  ws: ElysiaWebSocket,
  payload: Static<typeof subscribeSchema>
): Promise<void> {
  const { conversationId } = payload
  const userId = ws.data.userId

  if (!userId) return

  const isMember = await isParticipant(userId, conversationId)

  if (!isMember) {
    ws.send(JSON.stringify({
      event: "error",
      data: { code: "FORBIDDEN", message: "Not a participant" }
    }))
    return
  }

  subscribeToConversation(ws, conversationId)
  ws.send(JSON.stringify({ event: "subscribed", data: { conversationId } }))
}

async function handleTyping(
  ws: ElysiaWebSocket,
  payload: Static<typeof typingSchema>
): Promise<void> {
  const { conversationId, type } = payload
  const userId = ws.data.userId

  if (!userId) return

  if (!ws.data.conversationIds.has(conversationId)) return

  await broadcastToConversation(
    conversationId, 
    type, 
    { userId, conversationId }, 
    ws, 
    undefined, 
    userId
  )
}
