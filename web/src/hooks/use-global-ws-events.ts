import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouterState } from "@tanstack/react-router"
import { wsClient } from "@/lib/websocket-client"
import { friendsKeys } from "@/modules/friends/hooks/use-friends"
import { conversationsKeys } from "@/modules/chat/hooks/use-conversations"
import type { ConversationsList, Participant } from "@/lib/eden-types"

type ConversationEntry = ConversationsList["conversations"][number]

function resolveActiveConversationId(
  conversations: ConversationEntry[],
  activeUsername: string | undefined,
  currentUserId: string
): string | undefined {
  if (!activeUsername) return undefined

  const found = conversations.find((conv) =>
    conv.participants.some(
      (p: Participant) =>
        p.id !== currentUserId &&
        (p.username === activeUsername || p.displayUsername === activeUsername)
    )
  )

  return found?.id
}

type MessageNewData = {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: string
  createdAt: string
}

function updateSidebarOnNewMessage(
  old: ConversationsList | undefined,
  data: MessageNewData,
  currentUserId: string,
  activeConversationId: string | undefined,
  invalidate: () => void
): ConversationsList | undefined {
  if (!old?.conversations) {
    invalidate()
    return old
  }

  const resolvedActiveId = resolveActiveConversationId(
    old.conversations,
    activeConversationId,
    currentUserId
  )

  const index = old.conversations.findIndex((c: ConversationEntry) => c.id === data.conversationId)
  if (index === -1) {
    invalidate()
    return old
  }

  const conv = old.conversations[index]
  const isSenderCurrent = data.senderId === currentUserId
  const isActive = data.conversationId === resolvedActiveId

  const updatedConv: ConversationEntry = {
    ...conv,
    updatedAt: data.createdAt,
    lastMessage: {
      id: data.id,
      content: data.content,
      type: data.type as "text" | "audio" | "image",
      senderId: data.senderId,
      createdAt: data.createdAt,
    },
    unreadCount:
      !isSenderCurrent && !isActive
        ? (conv.unreadCount ?? 0) + 1
        : conv.unreadCount,
  }

  const others = old.conversations.filter((c: ConversationEntry) => c.id !== data.conversationId)
  const sorted = [updatedConv, ...others].sort((a, b) => {
    const aDate = a.lastMessage
      ? new Date(a.lastMessage.createdAt).getTime()
      : new Date(a.updatedAt).getTime()
    const bDate = b.lastMessage
      ? new Date(b.lastMessage.createdAt).getTime()
      : new Date(b.updatedAt).getTime()
    return bDate - aDate
  })

  return { conversations: sorted }
}

export function useGlobalWsEvents(currentUserId: string): void {
  const queryClient = useQueryClient()
  const { pathname } = useRouterState({
    select: (s) => ({ pathname: s.location.pathname }),
  })

  const queryClientRef = useRef(queryClient)
  queryClientRef.current = queryClient

  const activeUsername =
    pathname.startsWith("/chat/") && pathname !== "/chat/" && pathname !== "/chat"
      ? pathname.split("/").pop()
      : undefined

  const stateRef = useRef({ currentUserId, activeUsername })
  stateRef.current = { currentUserId, activeUsername }

  useEffect(() => {
    wsClient.acquire()

    const unsubRequestReceived = wsClient.on("friend:request-received", () => {
      queryClientRef.current.invalidateQueries({ queryKey: friendsKeys.pendingRequests() })
    })

    const unsubRequestAccepted = wsClient.on("friend:request-accepted", () => {
      queryClientRef.current.invalidateQueries({ queryKey: friendsKeys.all })
      queryClientRef.current.invalidateQueries({ queryKey: conversationsKeys.all })
    })

    const unsubConversationCreated = wsClient.on("conversation:created", (data) => {
      queryClientRef.current.invalidateQueries({ queryKey: conversationsKeys.list() })
      wsClient.subscribe(data.id)
    })

    const unsubMessageNew = wsClient.on("message:new", (data) => {
      queryClientRef.current.setQueryData(
        conversationsKeys.list(),
        (old: ConversationsList | undefined) =>
          updateSidebarOnNewMessage(
            old,
            data,
            stateRef.current.currentUserId,
            stateRef.current.activeUsername,
            () => queryClientRef.current.invalidateQueries({ queryKey: conversationsKeys.list() })
          )
      )
    })

    return () => {
      unsubRequestReceived()
      unsubRequestAccepted()
      unsubConversationCreated()
      unsubMessageNew()
      wsClient.release()
    }
  }, [])
}
