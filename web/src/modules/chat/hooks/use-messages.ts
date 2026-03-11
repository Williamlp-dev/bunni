import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Message, MessagesResponse } from "@/lib/eden-types"

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
    }: SendMessageParams) => {
      const { data, error } = await api
        .messages({ id: conversationId })
        .post({ content, type, audioUrl, audioDuration, imageUrl, replyToId })
      if (error) throw error
      return data
    },
    onSuccess: (realMessage, variables) => {
      if (!realMessage) return

      queryClient.setQueryData<InfiniteMessagesData>(
        messagesKeys.list(variables.conversationId),
        (old) => {
          if (!old?.pages?.length) return old

          const lastPageIndex = old.pages.length - 1
          const lastPage = old.pages[lastPageIndex]

          const messagesWithoutTemp = lastPage.messages.filter(
            (m: Message) => !m.id.startsWith("temp-")
          )

          const alreadyExists = messagesWithoutTemp.some(
            (m: Message) => m.id === realMessage.id
          )

          const updatedMessages = alreadyExists
            ? messagesWithoutTemp
            : [...messagesWithoutTemp, realMessage]

          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === lastPageIndex
                ? { ...page, messages: updatedMessages }
                : page
            ),
          }
        }
      )
    },
  })
}
