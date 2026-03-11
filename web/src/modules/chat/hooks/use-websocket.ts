import { useEffect, useCallback, useState, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { wsClient } from "@/lib/websocket-client"
import { messagesKeys, type InfiniteMessagesData } from "@/modules/chat/hooks/use-messages"
import type { Message } from "@/lib/eden-types"

type TypingUsers = {
  [conversationId: string]: string | null
}

type TypingTimeouts = {
  [conversationId: string]: ReturnType<typeof setTimeout> | null
}

const TYPING_THROTTLE_MS = 2000
const TYPING_TIMEOUT_MS = 3000

export function useWebSocket(userId: string): {
  subscribe: (conversationId: string) => void
  sendTypingStart: (conversationId: string) => void
  sendTypingStop: (conversationId: string) => void
  typingUsers: TypingUsers
} {
  const queryClient = useQueryClient()
  const [typingUsers, setTypingUsers] = useState<TypingUsers>({})
  const typingTimeoutsRef = useRef<TypingTimeouts>({})
  const lastTypingSentRef = useRef<{ [conversationId: string]: number }>({})
  const userIdRef = useRef<string>(userId)

  userIdRef.current = userId

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
            senderName:
              data.replyTo.sender.name ?? data.replyTo.sender.displayUsername,
            deletedAt: data.replyTo.deletedAt,
          }
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

    return () => {
      unsubscribeMessage()
      unsubscribeMessageDeleted()
      unsubscribeTypingStart()
      unsubscribeTypingStop()
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

  return {
    subscribe,
    sendTypingStart,
    sendTypingStop,
    typingUsers,
  }
}
