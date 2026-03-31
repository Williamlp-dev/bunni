import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Message } from "@/lib/eden-types"
import { messagesKeys, type InfiniteMessagesData } from "@/modules/chat/hooks/use-messages"
import { toast } from "sonner"

function updateMessagesCache(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  updater: (messages: Message[]) => Message[]
): void {
  queryClient.setQueryData<InfiniteMessagesData>(
    messagesKeys.list(conversationId),
    (old) => {
      if (!old?.pages) return old
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          messages: updater(page.messages),
        })),
      }
    }
  )
}

export type DeleteForMeOptions = {
  onUndoReady?: (undo: () => void) => void
}

export function useDeleteForMe(options?: DeleteForMeOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      messageIds,
    }: {
      conversationId: string
      messageIds: string[]
    }) => {
      const { data, error } = await api.messages["delete-for-me"].post({
        messageIds,
      })
      if (error) throw error
      return { ...data, conversationId, messageIds }
    },
    onMutate: async ({ conversationId, messageIds }) => {
      await queryClient.cancelQueries({
        queryKey: messagesKeys.list(conversationId),
      })

      const previousData = queryClient.getQueryData<InfiniteMessagesData>(
        messagesKeys.list(conversationId)
      )

      const removedMessages: Message[] = []
      if (previousData) {
        for (const page of previousData.pages) {
          for (const msg of page.messages) {
            if (messageIds.includes(msg.id)) {
              removedMessages.push(msg)
            }
          }
        }
      }

      updateMessagesCache(queryClient, conversationId, (messages) =>
        messages.filter((m) => !messageIds.includes(m.id))
      )

      return { previousData, removedMessages }
    },
    onError: (_error, { conversationId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          messagesKeys.list(conversationId),
          context.previousData
        )
      }
      toast.error("Erro ao apagar mensagens")
    },
    onSuccess: (data, _variables, context) => {
      if (!context?.removedMessages.length) return

      options?.onUndoReady?.(() => {
        undoDeleteForMe(
          data.conversationId,
          data.messageIds,
          context.removedMessages,
          queryClient
        )
      })
    },
  })
}

export async function undoDeleteForMe(
  conversationId: string,
  messageIds: string[],
  removedMessages: Message[],
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  updateMessagesCache(queryClient, conversationId, (messages) => {
    const restored = [...messages]
    for (const msg of removedMessages) {
      const insertIndex = restored.findIndex(
        (m) => new Date(m.createdAt) > new Date(msg.createdAt)
      )
      if (insertIndex === -1) {
        restored.push(msg)
      } else {
        restored.splice(insertIndex, 0, msg)
      }
    }
    return restored
  })

  try {
    const { error } = await api.messages["undo-delete-for-me"].post({
      messageIds,
    })
    if (error) throw error
  } catch {
    updateMessagesCache(queryClient, conversationId, (messages) =>
      messages.filter((m) => !messageIds.includes(m.id))
    )
    toast.error("Erro ao desfazer exclusão")
  }
}

export type DeleteForEveryoneOptions = {
  onSuccess?: () => void
}

export function useDeleteForEveryone(options?: DeleteForEveryoneOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      messageIds,
    }: {
      conversationId: string
      messageIds: string[]
    }) => {
      const { data, error } = await api.messages["delete-for-everyone"].post({
        messageIds,
      })
      if (error) throw error
      return { ...data, conversationId, messageIds }
    },
    onMutate: async ({ conversationId, messageIds }) => {
      await queryClient.cancelQueries({
        queryKey: messagesKeys.list(conversationId),
      })

      const previousData = queryClient.getQueryData<InfiniteMessagesData>(
        messagesKeys.list(conversationId)
      )

      updateMessagesCache(queryClient, conversationId, (messages) =>
        messages.map((m) =>
          messageIds.includes(m.id)
            ? { ...m, deletedAt: new Date().toISOString(), content: "Mensagem apagada" }
            : m
        )
      )

      return { previousData }
    },
    onError: (_error, { conversationId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          messagesKeys.list(conversationId),
          context.previousData
        )
      }
      toast.error("Erro ao apagar mensagens para todos")
    },
    onSuccess: () => {
      options?.onSuccess?.()
    },
  })
}

export function canDeleteForEveryone(
  selectedMessages: Message[],
  currentUserId: string
): boolean {
  if (selectedMessages.length === 0) return false
  return selectedMessages.every(
    (m) => m.senderId === currentUserId && !m.deletedAt
  )
}

export function useClearConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data, error } = await api.messages["clear-conversation"]({ conversationId }).post()
      if (error) throw error
      return { ...data, conversationId }
    },
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: messagesKeys.list(conversationId) })

      const previousData = queryClient.getQueryData<InfiniteMessagesData>(
        messagesKeys.list(conversationId)
      )

      queryClient.setQueryData<InfiniteMessagesData>(
        messagesKeys.list(conversationId),
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({ ...page, messages: [] })),
          }
        }
      )

      return { previousData }
    },
    onError: (_error, conversationId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(messagesKeys.list(conversationId), context.previousData)
      }
      toast.error("Erro ao limpar conversa")
    },
    onSuccess: (data) => {
      if (data.clearedCount === 0) {
        toast.info("A conversa já está vazia", {
          position: "bottom-center",
          className: "mb-24 bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full px-6 py-3 gap-3",
        })
        return
      }
      toast.success("Conversa limpa", {
        position: "bottom-center",
        className: "mb-24 bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full px-6 py-3 gap-3",
      })
    },
  })
}
