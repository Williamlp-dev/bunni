import type { ServerWebSocket } from "bun"
import { isBlocked } from "@/shared/helpers/relationship.helpers"

type WSData = {
  userId: string | null
  conversationIds: Set<string>
}

type ElysiaWebSocket = ServerWebSocket<WSData>

const userConnections = new Map<string, Set<ElysiaWebSocket>>()
const conversationSubscribers = new Map<string, Set<ElysiaWebSocket>>()

const MAX_CONVERSATIONS_PER_USER = 100

export function addConnection(ws: ElysiaWebSocket, userId: string): void {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set())
  }
  userConnections.get(userId)!.add(ws)
}

export function removeConnection(ws: ElysiaWebSocket, userId: string): void {
  const connections = userConnections.get(userId)
  if (!connections) return

  connections.delete(ws)
  if (connections.size === 0) {
    userConnections.delete(userId)
  }

  ws.data.conversationIds.forEach((convId) => {
    unsubscribeFromConversation(ws, convId)
  })
}

export function subscribeToConversation(
  ws: ElysiaWebSocket,
  conversationId: string
): void {
  if (ws.data.conversationIds.size >= MAX_CONVERSATIONS_PER_USER) {
    console.error(
      `User ${ws.data.userId} attempted to subscribe to more than ${MAX_CONVERSATIONS_PER_USER} conversations`
    )
    ws.send(
      JSON.stringify({
        event: "error",
        data: "Maximum conversation subscription limit reached",
      })
    )
    return
  }

  if (!conversationSubscribers.has(conversationId)) {
    conversationSubscribers.set(conversationId, new Set())
  }
  conversationSubscribers.get(conversationId)!.add(ws)
  ws.data.conversationIds.add(conversationId)
}

export function unsubscribeFromConversation(
  ws: ElysiaWebSocket,
  conversationId: string
): void {
  const subscribers = conversationSubscribers.get(conversationId)
  if (!subscribers) return

  subscribers.delete(ws)
  if (subscribers.size === 0) {
    conversationSubscribers.delete(conversationId)
  }
  ws.data.conversationIds.delete(conversationId)
}

export async function broadcastToConversation<T>(
  conversationId: string,
  event: string,
  data: T,
  excludeWs?: ElysiaWebSocket,
  excludeUserId?: string,
  senderId?: string
): Promise<void> {
  const subscribers = conversationSubscribers.get(conversationId)
  if (!subscribers) return

  const candidateWs = [...subscribers].filter(
    (ws) => ws !== excludeWs && ws.data.userId !== excludeUserId
  )

  const blockedFlags = senderId
    ? await Promise.all(
        candidateWs.map((ws) =>
          ws.data.userId ? isBlocked(senderId, ws.data.userId) : Promise.resolve(false)
        )
      )
    : candidateWs.map(() => false)

  const message = JSON.stringify({ event, data })
  for (let i = 0; i < candidateWs.length; i++) {
    if (blockedFlags[i]) continue
    if (candidateWs[i].readyState === 1) {
      candidateWs[i].send(message)
    }
  }
}

export function sendToUser<T>(userId: string, event: string, data: T): void {
  const connections = userConnections.get(userId)
  if (!connections) return

  const message = JSON.stringify({ event, data })
  for (const ws of connections) {
    if (ws.readyState === 1) {
      ws.send(message)
    }
  }
}

export function isUserOnline(userId: string): boolean {
  const connections = userConnections.get(userId)
  return connections !== undefined && connections.size > 0
}

export function isUserSubscribedToConversation(userId: string, conversationId: string): boolean {
  const subscribers = conversationSubscribers.get(conversationId)
  if (!subscribers) return false
  for (const ws of subscribers) {
    if (ws.data.userId === userId) return true
  }
  return false
}

export function getOnlineUserIds(): string[] {
  return Array.from(userConnections.keys())
}

export type { ElysiaWebSocket, WSData }
