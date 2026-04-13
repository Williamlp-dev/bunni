import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { wsClient } from "@/lib/websocket-client"
import { friendsKeys } from "@/modules/friends/hooks/use-friends"
import { conversationsKeys } from "@/modules/chat/hooks/use-conversations"
import { messagesKeys, type InfiniteMessagesData } from "@/modules/chat/hooks/use-messages"
import type { ConversationsList, Message } from "@/lib/eden-types"

type ConversationEntry = ConversationsList["conversations"][number]

type MessageNewData = {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: string
  audioUrl: string | null
  audioDuration: number | null
  imageUrl: string | null
  createdAt: string
  sender: {
    id: string
    name: string | null
    displayUsername: string
    image: string | null
  }
  replyTo?: {
    id: string
    content: string
    senderId: string
    sender: {
      id: string
      name: string | null
      displayUsername: string
      image: string | null
    }
    deletedAt: string | null
    createdAt: string
  }
}

function buildMessageFromEvent(data: MessageNewData): Message {
  return {
    id: data.id,
    conversationId: data.conversationId,
    senderId: data.senderId,
    sender: {
      id: data.sender.id,
      name: data.sender.name ?? "",
      displayUsername: data.sender.displayUsername,
      username: data.sender.displayUsername,
      image: data.sender.image,
    },
    content: data.content,
    type: data.type,
    audioUrl: data.audioUrl ?? null,
    audioDuration: data.audioDuration ?? null,
    imageUrl: data.imageUrl ?? null,
    createdAt: new Date(data.createdAt),
    deletedAt: null,
    replyTo: data.replyTo
      ? {
          id: data.replyTo.id,
          content: data.replyTo.content,
          sender: { ...data.replyTo.sender },
          createdAt: new Date(data.replyTo.createdAt),
          deletedAt: data.replyTo.deletedAt ? new Date(data.replyTo.deletedAt) : null,
        } as any
      : null,
  }
}

function injectMessageIntoCache(
  queryClient: ReturnType<typeof useQueryClient>,
  data: MessageNewData
): void {
  queryClient.setQueryData<InfiniteMessagesData>(
    messagesKeys.list(data.conversationId),
    (old) => {
      if (!old?.pages?.length) return old

      const lastPageIndex = old.pages.length - 1
      const lastPage = old.pages[lastPageIndex]

      const exists = lastPage.messages.some((m: Message) => m.id === data.id)
      if (exists) return old

      const newMessage = buildMessageFromEvent(data)

      return {
        ...old,
        pages: old.pages.map((page, i) =>
          i === lastPageIndex
            ? { ...page, messages: [...page.messages, newMessage] }
            : page
        ),
      }
    }
  )
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

  const index = old.conversations.findIndex(
    (c: ConversationEntry) => c.id === data.conversationId
  )
  if (index === -1) {
    invalidate()
    return old
  }

  const conv = old.conversations[index]
  const isSenderCurrent = data.senderId === currentUserId
  const isActive = data.conversationId === activeConversationId

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

  const others = old.conversations.filter(
    (c: ConversationEntry) => c.id !== data.conversationId
  )
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

type GlobalWsState = {
  currentUserId: string
  activeConversationId: string | undefined
}

export function useGlobalWsEvents(
  currentUserId: string,
  activeConversationId: string | undefined
): void {
  const queryClient = useQueryClient()

  const queryClientRef = useRef(queryClient)
  queryClientRef.current = queryClient

  const stateRef = useRef<GlobalWsState>({ currentUserId, activeConversationId })
  stateRef.current = { currentUserId, activeConversationId }

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
      const { currentUserId: uid, activeConversationId: activeId } = stateRef.current
      const qc = queryClientRef.current

      if (data.senderId !== uid) {
        injectMessageIntoCache(qc, data)

        if (data.conversationId === activeId) {
          wsClient.sendMessageRead(data.conversationId)
        }
      }

      qc.setQueryData(
        conversationsKeys.list(),
        (old: ConversationsList | undefined) =>
          updateSidebarOnNewMessage(
            old,
            data,
            uid,
            activeId,
            () => qc.invalidateQueries({ queryKey: conversationsKeys.list() })
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
