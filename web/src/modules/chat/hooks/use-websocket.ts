import { useEffect, useCallback, useState, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { wsClient } from "@/lib/websocket-client"
import { messagesKeys, type InfiniteMessagesData } from "@/modules/chat/hooks/use-messages"
import type { Message } from "@/lib/eden-types"
import type { MessageStatusType } from "@/lib/eden-types"

type TypingUsers = Record<string, string | null>
type TypingTimeouts = Record<string, ReturnType<typeof setTimeout> | null>

const TYPING_THROTTLE_MS = 2000
const TYPING_TIMEOUT_MS = 3000

type UseWebSocketOptions = {
  activeConversationId?: string | null
}

export function useWebSocket(userId: string, options?: UseWebSocketOptions): {
  subscribe: (conversationId: string) => void
  sendTypingStart: (conversationId: string) => void
  sendTypingStop: (conversationId: string) => void
  sendMessageRead: (conversationId: string) => void
  typingUsers: TypingUsers
} {
  const queryClient = useQueryClient()
  const [typingUsers, setTypingUsers] = useState<TypingUsers>({})
  const typingTimeoutsRef = useRef<TypingTimeouts>({})
  const lastTypingSentRef = useRef<{ [conversationId: string]: number }>({})
  const userIdRef = useRef<string>(userId)
  const activeConversationIdRef = useRef<string | null | undefined>(options?.activeConversationId)

  userIdRef.current = userId
  activeConversationIdRef.current = options?.activeConversationId

  useEffect(() => {
    wsClient.acquire()

    const unsubscribeMessage = wsClient.on("message:new", (data) => {
      if (data.senderId === userIdRef.current) {
        return
      }

      const newMessage: Message = {
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

      queryClient.setQueryData<InfiniteMessagesData>(
        messagesKeys.list(data.conversationId),
        (old) => {
          if (!old?.pages?.length) return old

          const lastPageIndex = old.pages.length - 1
          const lastPage = old.pages[lastPageIndex]

          const exists = lastPage.messages.some((m: Message) => m.id === newMessage.id)
          if (exists) return old

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

      if (data.conversationId === activeConversationIdRef.current) {
        wsClient.sendMessageRead(data.conversationId)
      }
    })

    const unsubscribeDelivered = wsClient.on("message:delivered", (data) => {
      queryClient.setQueryData<InfiniteMessagesData>(
        messagesKeys.list(data.conversationId),
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m: Message) => {
                if (m.senderId === userIdRef.current && (m.status as MessageStatusType) === "sent") {
                  return { ...m, status: "delivered" }
                }
                return m
              }),
            })),
          }
        }
      )
    })

    const unsubscribeRead = wsClient.on("message:read", (data) => {
      queryClient.setQueryData<InfiniteMessagesData>(
        messagesKeys.list(data.conversationId),
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m: Message) => {
                const status = m.status as MessageStatusType
                if (
                  m.senderId === userIdRef.current &&
                  (status === "delivered" || status === "sent" || status === "sending")
                ) {
                  return { ...m, status: "read" }
                }
                return m
              }),
            })),
          }
        }
      )
    })

    const unsubscribeMessageDeleted = wsClient.on("message:deleted", (data) => {
      queryClient.setQueryData<InfiniteMessagesData>(
        messagesKeys.list(data.conversationId),
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m: Message) => {
                if (m.id === data.id) {
                  return {
                    ...m,
                    deletedAt: new Date(),
                    content: "Mensagem apagada",
                  }
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

    const unsubscribeTypingStart = wsClient.on("typing:start", (data) => {
      const existingTimeout = typingTimeoutsRef.current[data.conversationId]
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      setTypingUsers((prev) => ({
        ...prev,
        [data.conversationId]: data.userId,
      }))

      typingTimeoutsRef.current[data.conversationId] = setTimeout(() => {
        setTypingUsers((prev) => ({
          ...prev,
          [data.conversationId]: null,
        }))
        typingTimeoutsRef.current[data.conversationId] = null
      }, TYPING_TIMEOUT_MS)
    })

    const unsubscribeTypingStop = wsClient.on("typing:stop", (data) => {
      const existingTimeout = typingTimeoutsRef.current[data.conversationId]
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        typingTimeoutsRef.current[data.conversationId] = null
      }

      setTypingUsers((prev) => ({
        ...prev,
        [data.conversationId]: null,
      }))
    })

    const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ["users"] })
    const unsubscribeBlocked = wsClient.on("conversation:blocked", invalidateUsers)
    const unsubscribeUnblocked = wsClient.on("conversation:unblocked", invalidateUsers)

    return () => {
      unsubscribeMessage()
      unsubscribeDelivered()
      unsubscribeRead()
      unsubscribeMessageDeleted()
      unsubscribeTypingStart()
      unsubscribeTypingStop()
      unsubscribeBlocked()
      unsubscribeUnblocked()
      wsClient.release()

      Object.values(typingTimeoutsRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout)
      })
    }
  }, [queryClient])

  const subscribe = useCallback((conversationId: string) => {
    wsClient.subscribe(conversationId)
  }, [])

  const sendTypingStart = useCallback((conversationId: string) => {
    const now = Date.now()
    const lastSent = lastTypingSentRef.current[conversationId] ?? 0

    if (now - lastSent < TYPING_THROTTLE_MS) {
      return
    }

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

  return {
    subscribe,
    sendTypingStart,
    sendTypingStop,
    sendMessageRead,
    typingUsers,
  }
}
