import { useCallback, useRef } from "react"
import { wsClient } from "@/lib/websocket-client"
import { TYPING_THROTTLE_MS } from "@/modules/chat/utils/message-status"

type UseWebSocketReturn = {
  sendTypingStart: (conversationId: string) => void
  sendTypingStop: (conversationId: string) => void
  sendMessageRead: (conversationId: string) => void
}

export function useWebSocket(): UseWebSocketReturn {
  const lastTypingSentRef = useRef<Record<string, number>>({})

  const sendTypingStart = useCallback((conversationId: string) => {
    const now = Date.now()
    const lastSent = lastTypingSentRef.current[conversationId] ?? 0

    if (now - lastSent < TYPING_THROTTLE_MS) return

    lastTypingSentRef.current[conversationId] = now
    wsClient.sendTypingStart(conversationId)
  }, [])

  const sendTypingStop = useCallback((conversationId: string) => {
    lastTypingSentRef.current[conversationId] = 0
    wsClient.sendTypingStop(conversationId)
  }, [])

  const sendMessageRead = useCallback((conversationId: string) => {
    wsClient.sendMessageRead(conversationId)
  }, [])

  return { sendTypingStart, sendTypingStop, sendMessageRead }
}
