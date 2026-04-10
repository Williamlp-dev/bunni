import { useState, useEffect } from "react"
import { useNavigate, useRouteContext } from "@tanstack/react-router"
import { useSuspenseConversationByUsername } from "@/modules/chat/hooks/use-conversations"
import { useSuspenseMessages, useSendMessage, flattenMessages, messagesKeys, type InfiniteMessagesData } from "@/modules/chat/hooks/use-messages"
import { useDeleteForMe, useDeleteForEveryone, canDeleteForEveryone, useClearConversation } from "@/modules/chat/hooks/use-delete-messages"
import { useWebSocket } from "@/modules/chat/hooks/use-websocket"
import { useMessageSelection } from "@/modules/chat/hooks/use-message-selection"
import { useAudioUpload } from "@/modules/chat/hooks/use-audio-upload"
import { useImageUpload } from "@/modules/chat/hooks/use-image-upload"
import { useBlockStatus } from "@/modules/profile/hooks/use-block-user"
import { conversationsKeys } from "@/modules/chat/hooks/use-conversations"
import type { Message, Participant } from "@/lib/eden-types"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { wsClient } from "@/lib/websocket-client"

type SessionUser = {
  id: string
  name: string | null
  image?: string | null
  username?: string | null
  displayUsername?: string | null
}

type RouteSession = {
  user: SessionUser
}

function buildOptimisticMessage(
  session: RouteSession,
  currentUserId: string,
  conversationId: string,
  overrides: Partial<Message>
): Message {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    conversationId,
    senderId: currentUserId,
    content: overrides.content ?? "",
    type: overrides.type ?? "text",
    status: "sending" as any,
    audioUrl: overrides.audioUrl ?? null,
    audioDuration: overrides.audioDuration ?? null,
    imageUrl: overrides.imageUrl ?? null,
    createdAt: new Date() as any,
    deletedAt: null,
    sender: {
      id: currentUserId,
      name: session.user.name ?? "Você",
      image: session.user.image ?? null,
      username: session.user.username ?? "voce",
      displayUsername: session.user.displayUsername ?? "voce",
    },
    replyTo: overrides.replyTo ?? null,
  }
}

function markMessageAsError(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string
): void {
  queryClient.setQueryData<InfiniteMessagesData>(
    messagesKeys.list(conversationId),
    (old) => {
      if (!old?.pages) return old
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m: Message) =>
            m.id === messageId ? { ...m, status: "error" } : m
          ),
        })),
      }
    }
  )
}

export function useChatPage(username: string) {
  const { session } = useRouteContext({ from: "/_layout" })
  const navigate = useNavigate()
  const currentUserId = session.user.id
  const safeUsername = username && username !== "undefined" ? username : ""
  const {
    data: conversationData,
  } = useSuspenseConversationByUsername(safeUsername)

  const conversationId = conversationData?.id ?? ""
  const participants = conversationData?.participants ?? []
  const targetUser = participants.find((p: Participant) => p.id !== currentUserId) ?? null
  const displayName = targetUser?.name ?? safeUsername

  const {
    data: messagesData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSuspenseMessages(conversationId)

  const sendMessageMutation = useSendMessage()
  const audioUpload = useAudioUpload()
  const imageUpload = useImageUpload()
  const { subscribe, sendTypingStart, sendTypingStop, sendMessageRead, typingUsers } = useWebSocket(currentUserId, { activeConversationId: conversationId || null })
  const { selectedMessages, isSelectionMode, selectMessage, toggleMessage, clearSelection, copySelectedContent } = useMessageSelection()

  const blockStatusQuery = useBlockStatus(targetUser?.id ?? "")
  const isBlockedByMe = blockStatusQuery.data?.isBlockedByMe ?? false
  const isBlockedByThem = blockStatusQuery.data?.isBlockedByThem ?? false
  const isBlocked = isBlockedByMe || isBlockedByThem

  const queryClient = useQueryClient()
  const messages = flattenMessages(messagesData)

  const typingUserId = conversationId ? (typingUsers[conversationId] ?? null) : null
  const isTyping = typingUserId !== null && typingUserId !== currentUserId

  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTargetMessages, setDeleteTargetMessages] = useState<Message[]>([])
  const [isClearChatDialogOpen, setIsClearChatDialogOpen] = useState(false)

  const deleteForMe = useDeleteForMe({
    onUndoReady: (undo) => {
      toast.success("Mensagens apagadas", {
        position: "bottom-center",
        className: "mb-24 bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full px-6 py-3 gap-3",
        action: {
          label: "Desfazer",
          onClick: undo,
        },
      })
    },
  })

  const deleteForEveryone = useDeleteForEveryone({
    onSuccess: () => {
      toast.success("Mensagens apagadas para todos", {
        position: "bottom-center",
        className: "mb-24 bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full px-6 py-3 gap-3"
      })
    }
  })

  const clearConversation = useClearConversation()

  useEffect(() => {
    if (!conversationId) return
    subscribe(conversationId)
    sendMessageRead(conversationId)

    queryClient.setQueryData<{ conversations: Array<{ id: string; unreadCount: number }> }>(
      conversationsKeys.list(),
      (old) => {
        if (!old?.conversations) return old
        return {
          ...old,
          conversations: old.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          ),
        }
      }
    )

    return () => {
      wsClient.unsubscribe(conversationId)
    }
  }, [conversationId, subscribe, sendMessageRead, queryClient])

  const handleDeleteRequest = (msgs: Message[]) => {
    setDeleteTargetMessages(msgs)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteFromSelection = () => {
    const msgs = Array.from(selectedMessages.values())
    handleDeleteRequest(msgs)
  }

  const resetDeleteState = () => {
    clearSelection()
    setDeleteTargetMessages([])
  }

  const handleDeleteForMe = () => {
    if (!conversationId || deleteTargetMessages.length === 0) return
    deleteForMe.mutate({
      conversationId,
      messageIds: deleteTargetMessages.map((m) => m.id),
    })
    resetDeleteState()
  }

  const handleClearChat = () => {
    if (!conversationId) return
    clearConversation.mutate(conversationId)
  }

  const handleDeleteForEveryone = () => {
    if (!conversationId || deleteTargetMessages.length === 0) return
    deleteForEveryone.mutate({
      conversationId,
      messageIds: deleteTargetMessages.map((m) => m.id),
    })
    resetDeleteState()
  }

  const handleSendMessage = (content: string) => {
    if (!conversationId) return
    sendTypingStop(conversationId)

    const messageId = crypto.randomUUID()

    const optMessage = buildOptimisticMessage(session, currentUserId, conversationId, {
      id: messageId,
      content,
      type: "text",
      replyTo: replyingTo
        ? ({
          id: replyingTo.id,
          content: replyingTo.content,
          sender: { ...replyingTo.sender },
          createdAt: replyingTo.createdAt,
          deletedAt: replyingTo.deletedAt,
        } as any)
        : null,
    })

    sendMessageMutation.mutate({
      id: messageId,
      conversationId,
      content,
      replyToId: replyingTo?.id,
      replyToMessage: replyingTo ?? undefined,
      optimisticMessage: optMessage,
    })

    setReplyingTo(null)
  }

  const handleSendAudioMessage = async (blob: Blob, duration: number) => {
    if (!conversationId) return

    sendTypingStop(conversationId)

    const messageId = crypto.randomUUID()

    const optMessage = buildOptimisticMessage(session, currentUserId, conversationId, {
      id: messageId,
      content: "🎤 Mensagem de voz",
      type: "audio",
      audioUrl: URL.createObjectURL(blob),
      audioDuration: duration,
    })

    try {
      const result = await audioUpload.mutateAsync({ blob, duration, conversationId })
      await sendMessageMutation.mutateAsync({
        id: messageId,
        conversationId,
        content: "🎤 Mensagem de voz",
        type: "audio",
        audioUrl: result.publicUrl,
        audioDuration: duration,
        optimisticMessage: optMessage,
      })
    } catch {
      markMessageAsError(queryClient, conversationId, messageId)
      toast.error("Falha ao enviar áudio", {
        description: "Ocorreu um erro no upload. Verifique sua conexão e tente novamente.",
        position: "bottom-center",
        className: "mb-24",
      })
    }
  }

  const handleSendImageMessage = async (file: File) => {
    if (!conversationId) return

    const messageId = crypto.randomUUID()

    const optMessage = buildOptimisticMessage(session, currentUserId, conversationId, {
      id: messageId,
      type: "image",
      imageUrl: URL.createObjectURL(file),
    })

    try {
      const result = await imageUpload.mutateAsync({ file, conversationId })
      await sendMessageMutation.mutateAsync({
        id: messageId,
        conversationId,
        content: "",
        type: "image",
        imageUrl: result.publicUrl,
        optimisticMessage: optMessage,
      })
    } catch {
      markMessageAsError(queryClient, conversationId, messageId)
      toast.error("Falha ao enviar imagem", {
        description: "Não foi possível fazer o upload. Tente novamente.",
        position: "bottom-center",
        className: "mb-24",
      })
    }
  }

  const handleTyping = () => {
    if (!conversationId) return
    sendTypingStart(conversationId)
  }

  const handleCopySelected = async () => {
    await copySelectedContent()
    clearSelection()
  }

  const handleReplySelected = () => {
    const firstSelected = Array.from(selectedMessages.values())[0]
    if (firstSelected) {
      setReplyingTo(firstSelected)
      clearSelection()
    }
  }

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const navigateToChat = () => navigate({ to: "/chat" })

  return {
    safeUsername,
    currentUserId,
    displayName,
    targetUser,
    conversationId,

    messages,

    isBlocked,
    isBlockedByMe,
    isBlockedByThem,
    isTyping,
    replyingTo,
    setReplyingTo,

    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteTargetMessages,
    showDeleteForEveryone: canDeleteForEveryone(deleteTargetMessages, currentUserId),

    isClearChatDialogOpen,
    setIsClearChatDialogOpen,

    selectedMessages,
    isSelectionMode,
    selectMessage,
    toggleMessage,
    clearSelection,

    hasNextPage,
    isFetchingNextPage,

    handleSendMessage,
    handleSendAudioMessage,
    handleSendImageMessage,
    isSendingAudio: audioUpload.isPending,
    isSendingImage: imageUpload.isPending,
    handleTyping,
    handleDeleteRequest,
    handleDeleteFromSelection,
    handleDeleteForMe,
    handleDeleteForEveryone,
    handleClearChat,
    handleCopySelected,
    handleReplySelected,
    handleLoadMore,
    navigateToChat,
  }
}
