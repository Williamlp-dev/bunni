import { Elysia } from "elysia"
import { auth } from "@/auth"
import {
  addConnection,
  removeConnection,
} from "./connection-manager"
import { handleMessage } from "./handlers"
import { notifyOnlineStatus } from "@/modules/users/user.service"
import { markPendingAsDelivered } from "@/modules/messages/message.service"
import type { ServerWebSocket } from "bun"

export type WSData = {
  userId: string | null
  conversationIds: Set<string>
  headers: Record<string, string | undefined>
}

async function authenticateFromHeaders(
  headers: Record<string, string | undefined>
): Promise<string | null> {
  const headerObj = new Headers()
  for (const [key, value] of Object.entries(headers)) {
    if (value) headerObj.set(key, value)
  }

  const session = await auth.api.getSession({ headers: headerObj })
  return session?.user?.id ?? null
}

export const wsPlugin = new Elysia({ name: "websocket" })
  .derive(() => {
    return {
      userId: null as string | null,
      conversationIds: new Set<string>(),
    }
  })
  .ws("/ws", {
    perMessageDeflate: true,
    idleTimeout: 120,
    maxPayloadLength: 16 * 1024 * 1024,

    async open(ws) {
      const userId = await authenticateFromHeaders(ws.data.headers)

      if (!userId) {
        ws.close(4001, "Unauthorized")
        return
      }

      Object.assign(ws.data, { userId })

      addConnection(ws.raw as ServerWebSocket<WSData>, userId)

      await markPendingAsDelivered(userId)

      ws.send(JSON.stringify({ event: "connected", data: { userId } }))

      await notifyOnlineStatus(userId, true)
    },

    async message(ws, message) {
      if (!ws.data.userId) return

      await handleMessage(ws.raw as ServerWebSocket<WSData>, message)
    },

    async close(ws) {
      if (!ws.data.userId) return

      removeConnection(ws.raw as ServerWebSocket<WSData>, ws.data.userId)
      await notifyOnlineStatus(ws.data.userId, false)
    },
  })
