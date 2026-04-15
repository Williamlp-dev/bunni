import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { wsClient } from "@/lib/websocket-client"
import type { WebSocketEventData } from "@/lib/websocket-client"
import { friendsKeys } from "@/modules/friends/hooks/use-friends"
import { conversationsKeys, useConversations } from "@/modules/chat/hooks/use-conversations"
import { messagesKeys, type InfiniteMessagesData } from "@/modules/chat/hooks/use-messages"
import { resolveStatus, TYPING_TIMEOUT_MS } from "@/modules/chat/utils/message-status"
import { useChatStore } from "@/modules/chat/store/chat-store"
import type { ConversationsList, Message, MessageStatusType } from "@/lib/eden-types"

type ConversationEntry = ConversationsList["conversations"][number]
type MessageNewPayload = WebSocketEventData["message:new"]


function buildMessageFromEvent(data: MessageNewPayload): Message {
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
        }
      : null,
  }
}

function injectMessageIntoCache(
  queryClient: ReturnType<typeof useQueryClient>,
  data: MessageNewPayload
): void {
  queryClient.setQueryData<InfiniteMessagesData>(
    messagesKeys.list(data.conversationId),
    (old) => {
      if (!old?.pages?.length) return old

      const lastPageIndex = old.pages.length - 1
      const lastPage = old.pages[lastPageIndex]

      if (lastPage.messages.some((m: Message) => m.id === data.id)) return old

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


function buildUpdatedSidebar(
  old: ConversationsList | undefined,
  data: MessageNewPayload,
  currentUserId: string,
  activeConversationId: string | undefined,
  invalidate: () => void
): ConversationsList | undefined {
  if (!old?.conversations) {
    invalidate()
    return old
  }

  const conversationIndex = old.conversations.findIndex(
    (c: ConversationEntry) => c.id === data.conversationId
  )

  if (conversationIndex === -1) {
    invalidate()
    return old
  }

  const conversation = old.conversations[conversationIndex]
  const isSentByCurrentUser = data.senderId === currentUserId
  const isUserActiveInChat = data.conversationId === activeConversationId

  const cachedStatus =
    conversation.lastMessage?.id === data.id
      ? (conversation.lastMessage.status as string)
      : undefined
  const resolvedStatus = resolveStatus(cachedStatus, data.status as string)

  const updatedConversation: ConversationEntry = {
    ...conversation,
    updatedAt: data.createdAt,
    lastMessage: {
      id: data.id,
      content: data.content,
      type: data.type as "text" | "audio" | "image",
      senderId: data.senderId,
      createdAt: data.createdAt,
      status: resolvedStatus as "sent" | "delivered" | "read",
    },
    unreadCount:
      !isSentByCurrentUser && !isUserActiveInChat
        ? (conversation.unreadCount ?? 0) + 1
        : conversation.unreadCount,
  }

  const remainingConversations = old.conversations.filter(
    (c: ConversationEntry) => c.id !== data.conversationId
  )

  return { conversations: [updatedConversation, ...remainingConversations] }
}


function updateSidebarLastMessageStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  nextStatus: "delivered" | "read",
  currentUserId: string
): void {
  queryClient.setQueryData<ConversationsList>(
    conversationsKeys.list(),
    (old: ConversationsList | undefined) => {
      if (!old?.conversations) return old
      return {
        conversations: old.conversations.map((c: ConversationEntry) => {
          if (c.id !== conversationId) return c
          if (!c.lastMessage) return c
          if (c.lastMessage.senderId !== currentUserId) return c

          const current = c.lastMessage.status as MessageStatusType
          if (nextStatus === "delivered" && current !== "sent") return c
          if (nextStatus === "read" && current === "read") return c

          return { ...c, lastMessage: { ...c.lastMessage, status: nextStatus } }
        }),
      }
    }
  )
}

function updateMessagesStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  nextStatus: "delivered" | "read",
  currentUserId: string
): void {
  queryClient.setQueryData<InfiniteMessagesData>(
    messagesKeys.list(conversationId),
    (old) => {
      if (!old?.pages) return old
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m: Message) => {
            if (m.senderId !== currentUserId) return m
            const status = m.status as MessageStatusType
            if (nextStatus === "delivered" && status !== "sent") return m
            if (nextStatus === "read" && status === "read") return m
            return { ...m, status: nextStatus }
          }),
        })),
      }
    }
  )
}

export function useGlobalWsEvents(currentUserId: string): void {
  const queryClient = useQueryClient()
  const { setTyping, setPresence, resetPresence } = useChatStore()
  const { data: conversationsList } = useConversations()

  const queryClientRef = useRef(queryClient)
  queryClientRef.current = queryClient

  const conversationsListRef = useRef(conversationsList)
  conversationsListRef.current = conversationsList

  const currentUserIdRef = useRef(currentUserId)
  currentUserIdRef.current = currentUserId

  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({})

  useEffect(() => {
    if (conversationsList?.conversations) {
      conversationsList.conversations.forEach((c: ConversationEntry) => wsClient.subscribe(c.id))
    }
  }, [conversationsList])

  useEffect(() => {
    wsClient.acquire()

    const unsubConnected = wsClient.on("connected", () => {
      const currentList = conversationsListRef.current
      if (currentList?.conversations) {
        currentList.conversations.forEach((c: ConversationEntry) => wsClient.subscribe(c.id))
      }

      resetPresence()
      queryClientRef.current.invalidateQueries({ queryKey: conversationsKeys.all })
    })

    const unsubFriendRequestReceived = wsClient.on("friend:request-received", () => {
      queryClientRef.current.invalidateQueries({ queryKey: friendsKeys.pendingRequests() })
    })

    const unsubFriendRequestAccepted = wsClient.on("friend:request-accepted", () => {
      queryClientRef.current.invalidateQueries({ queryKey: friendsKeys.all })
      queryClientRef.current.invalidateQueries({ queryKey: conversationsKeys.all })
    })

    const unsubConversationCreated = wsClient.on("conversation:created", (data) => {
      queryClientRef.current.invalidateQueries({ queryKey: conversationsKeys.list() })
      wsClient.subscribe(data.id)
    })

    const unsubMessageNew = wsClient.on("message:new", (data) => {
      const uid = currentUserIdRef.current
      const activeId = useChatStore.getState().activeConversationId
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
          buildUpdatedSidebar(
            old,
            data,
            uid,
            activeId,
            () => qc.invalidateQueries({ queryKey: conversationsKeys.list() })
          )
      )
    })

    const unsubDelivered = wsClient.on("message:delivered", (data) => {
      const uid = currentUserIdRef.current
      const qc = queryClientRef.current
      updateMessagesStatus(qc, data.conversationId, "delivered", uid)
      updateSidebarLastMessageStatus(qc, data.conversationId, "delivered", uid)
    })

    const unsubRead = wsClient.on("message:read", (data) => {
      const uid = currentUserIdRef.current
      const qc = queryClientRef.current
      updateMessagesStatus(qc, data.conversationId, "read", uid)
      updateSidebarLastMessageStatus(qc, data.conversationId, "read", uid)
    })

    const unsubUserOnline = wsClient.on("user:online", (data) => {
      setPresence(data.userId, "online")
    })

    const unsubUserOffline = wsClient.on("user:offline", (data) => {
      setPresence(data.userId, "offline")
    })

    const unsubMessageDeleted = wsClient.on("message:deleted", (data) => {
      queryClientRef.current.setQueryData<InfiniteMessagesData>(
        messagesKeys.list(data.conversationId),
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m: Message) => {
                if (m.id === data.id) {
                  return { ...m, deletedAt: new Date(), content: "Mensagem apagada" }
                }
                if (m.replyTo?.id === data.id) {
                  return {
                    ...m,
                    replyTo: {
                      ...m.replyTo,
                      deletedAt: new Date().toISOString(),
                      content: "Mensagem apagada",
                    },
                  }
                }
                return m
              }),
            })),
          }
        }
      )
    })

    const invalidateUsers = () =>
      queryClientRef.current.invalidateQueries({ queryKey: ["users"] })
    const unsubBlocked = wsClient.on("conversation:blocked", invalidateUsers)
    const unsubUnblocked = wsClient.on("conversation:unblocked", invalidateUsers)

    const unsubTypingStart = wsClient.on("typing:start", (data) => {
      const existingTimeout = typingTimeoutsRef.current[data.conversationId]
      if (existingTimeout) clearTimeout(existingTimeout)

      setTyping(data.conversationId, data.userId)

      typingTimeoutsRef.current[data.conversationId] = setTimeout(() => {
        setTyping(data.conversationId, null)
        typingTimeoutsRef.current[data.conversationId] = null
      }, TYPING_TIMEOUT_MS)
    })

    const unsubTypingStop = wsClient.on("typing:stop", (data) => {
      const existingTimeout = typingTimeoutsRef.current[data.conversationId]
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        typingTimeoutsRef.current[data.conversationId] = null
      }
      setTyping(data.conversationId, null)
    })

    return () => {
      unsubConnected()
      unsubFriendRequestReceived()
      unsubFriendRequestAccepted()
      unsubConversationCreated()
      unsubMessageNew()
      unsubDelivered()
      unsubRead()
      unsubUserOnline()
      unsubUserOffline()
      unsubMessageDeleted()
      unsubBlocked()
      unsubUnblocked()
      unsubTypingStart()
      unsubTypingStop()
      wsClient.release()

      Object.values(typingTimeoutsRef.current).forEach((t) => {
        if (t) clearTimeout(t)
      })
    }
  }, [setTyping, setPresence, resetPresence])
}
