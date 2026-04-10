import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { api } from "@/lib/api"
import { conversationsKeys } from "@/modules/chat/hooks/use-conversations"
import type { Message, MessagesResponse, ConversationsList } from "@/lib/eden-types"

const STATUS_PRIORITY: Record<string, number> = {
  error: 0,
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
}

export type InfiniteMessagesData = {
  pages: MessagesResponse[]
  pageParams: (string | null)[]
}

type SendMessageParams = {
  conversationId: string
  content: string
  type?: "text" | "audio" | "image"
  audioUrl?: string
  audioDuration?: number
  imageUrl?: string
  replyToId?: string
  replyToMessage?: Message
  id?: string
  optimisticMessage?: Message
}

type UseMessagesOptions = {
  limit?: number
}

export const messagesKeys = {
  all: ["messages"] as const,
  list: (conversationId: string) =>
    [...messagesKeys.all, "list", conversationId] as const,
}

export function useMessages(
  conversationId: string,
  options: UseMessagesOptions = {}
) {
  const limit = options.limit ?? 50

  return useInfiniteQuery({
    queryKey: messagesKeys.list(conversationId),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.messages({ id: conversationId }).get({
        query: {
          limit: String(limit),
          after: pageParam ?? undefined,
        },
      })
      if (error) throw error
      return data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useSuspenseMessages(
  conversationId: string,
  options: UseMessagesOptions = {}
) {
  const limit = options.limit ?? 50

  return useSuspenseInfiniteQuery({
    queryKey: messagesKeys.list(conversationId),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.messages({ id: conversationId }).get({
        query: {
          limit: String(limit),
          after: pageParam ?? undefined,
        },
      })
      if (error) throw error.value
      return data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
    staleTime: 1000 * 60 * 2,
  })
}

export function flattenMessages(
  data: { pages: (MessagesResponse | undefined)[] } | undefined
): Message[] {
  if (!data?.pages) return []
  return data.pages.flatMap((page) => page?.messages ?? [])
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      type,
      audioUrl,
      audioDuration,
      imageUrl,
      replyToId,
      id,
    }: SendMessageParams) => {
      const { data, error } = await api
        .messages({ id: conversationId })
        .post({ content, type, audioUrl, audioDuration, imageUrl, replyToId, id })
      if (error) throw error
      return data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: messagesKeys.list(variables.conversationId) })

      const previousData = queryClient.getQueryData<InfiniteMessagesData>(
        messagesKeys.list(variables.conversationId)
      )

      if (variables.optimisticMessage) {
        queryClient.setQueryData<InfiniteMessagesData>(
          messagesKeys.list(variables.conversationId),
          (old) => {
            if (!old?.pages?.length) return old
            const lastPageIndex = old.pages.length - 1
            return {
              ...old,
              pages: old.pages.map((page: MessagesResponse, i: number) =>
                i === lastPageIndex
                  ? { ...page, messages: [...page.messages, variables.optimisticMessage!] }
                  : page
              ),
            }
          }
        )

        const optMsg = variables.optimisticMessage
        const now = new Date()
        queryClient.setQueryData(
          conversationsKeys.list(),
          (old: ConversationsList | undefined) => {
            if (!old?.conversations) return old
            type ConvItem = ConversationsList["conversations"][number]
            return {
              conversations: old.conversations
                .map((conv: ConvItem) => {
                  if (conv.id !== variables.conversationId) return conv
                  return {
                    ...conv,
                    updatedAt: now,
                    lastMessage: {
                      id: optMsg.id,
                      content: optMsg.content,
                      type: optMsg.type as "text" | "audio" | "image",
                      senderId: optMsg.senderId,
                      createdAt: now,
                    },
                  }
                })
                .sort((a: ConvItem, b: ConvItem) => {
                  const aDate = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime()
                  const bDate = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime()
                  return bDate - aDate
                }),
            }
          }
        )
      }

      return { previousData }
    },
    onSuccess: (realMessage, variables) => {
      if (!realMessage) return

      queryClient.setQueryData<InfiniteMessagesData>(
        messagesKeys.list(variables.conversationId),
        (old) => {
          if (!old?.pages?.length) return old

          const lastPageIndex = old.pages.length - 1
          const lastPage = old.pages[lastPageIndex]

          const alreadyExists = lastPage.messages.some(
            (m: Message) => m.id === realMessage.id
          )

          const updatedMessages = alreadyExists
            ? lastPage.messages.map((m: Message) => {
                if (m.id !== realMessage.id) return m
                const cachedPriority = STATUS_PRIORITY[m.status as string] ?? 0
                const serverPriority = STATUS_PRIORITY[realMessage.status as string] ?? 0
                return {
                  ...realMessage,
                  status: cachedPriority > serverPriority ? m.status : realMessage.status,
                }
              })
            : [...lastPage.messages, realMessage]

          return {
            ...old,
            pages: old.pages.map((page: MessagesResponse, i: number) =>
              i === lastPageIndex
                ? { ...page, messages: updatedMessages }
                : page
            ),
          }
        }
      )

      queryClient.setQueryData(
        conversationsKeys.list(),
        (old: ConversationsList | undefined) => {
          if (!old?.conversations) return old
          type ConvItem = ConversationsList["conversations"][number]
          return {
            conversations: old.conversations
              .map((conv: ConvItem) => {
                if (conv.id !== variables.conversationId) return conv
                return {
                  ...conv,
                  updatedAt: realMessage.createdAt,
                  lastMessage: {
                    id: realMessage.id,
                    content: realMessage.content,
                    type: realMessage.type as "text" | "audio" | "image",
                    senderId: realMessage.senderId,
                    createdAt: realMessage.createdAt,
                  },
                }
              })
              .sort((a: ConvItem, b: ConvItem) => {
                const aDate = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime()
                const bDate = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime()
                return bDate - aDate
              }),
          }
        }
      )
    },
    onError: (_error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          messagesKeys.list(variables.conversationId),
          context.previousData
        )
      }
    },
  })
}
