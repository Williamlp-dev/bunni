import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { wsClient } from "@/lib/websocket-client"
import { friendsKeys } from "@/modules/friends/hooks/use-friends"
import { conversationsKeys } from "@/modules/chat/hooks/use-conversations"

export function useGlobalWsEvents(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    wsClient.acquire()

    const unsubRequestReceived = wsClient.on("friend:request-received", () => {
      queryClient.invalidateQueries({ queryKey: friendsKeys.pendingRequests() })
    })

    const unsubRequestAccepted = wsClient.on("friend:request-accepted", () => {
      queryClient.invalidateQueries({ queryKey: friendsKeys.all })
      queryClient.invalidateQueries({ queryKey: conversationsKeys.all })
    })

    const unsubConversationCreated = wsClient.on("conversation:created", (data) => {
      queryClient.invalidateQueries({ queryKey: conversationsKeys.list() })
      wsClient.subscribe(data.id)
    })

    return () => {
      unsubRequestReceived()
      unsubRequestAccepted()
      unsubConversationCreated()
      wsClient.release()
    }
  }, [queryClient])
}
