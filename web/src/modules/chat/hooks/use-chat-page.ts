import { useState, useEffect, useOptimistic, startTransition } from "react"
import { useNavigate, useRouteContext } from "@tanstack/react-router"
import { useSuspenseConversationByUsername } from "@/modules/chat/hooks/use-conversations"
import { useSuspenseMessages, useSendMessage, flattenMessages } from "@/modules/chat/hooks/use-messages"
import { useDeleteForMe, useDeleteForEveryone, canDeleteForEveryone } from "@/modules/chat/hooks/use-delete-messages"
import { useWebSocket } from "@/modules/chat/hooks/use-websocket"
import { useMessageSelection } from "@/modules/chat/hooks/use-message-selection"
import { useAudioUpload } from "@/modules/chat/hooks/use-audio-upload"
import { useImageUpload } from "@/modules/chat/hooks/use-image-upload"
import type { Message } from "@/lib/eden-types"
import { toast } from "sonner"

function buildOptimisticMessage(
  session: any,
  currentUserId: string,
  conversationId: string,
  overrides: Partial<Message>
): Message {
  return {
    id: `temp-${Date.now()}`,
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

export function useChatPage(username: string) {
  const { session } = useRouteContext({ from: "/_layout" })
  const navigate = useNavigate()
  const currentUserId = session.user.id
  const safeUsername = username && username !== "undefined" ? username : ""
  const {
    data: conversationData,
  } = useSuspenseConversationByUsername(safeUsername)

  const conversationId = conversationData?.id ?? ""
  const targetUser = conversationData?.targetUser
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
  const { subscribe, sendTypingStart, sendTypingStop, typingUsers } = useWebSocket(currentUserId)
  const { selectedMessages, isSelectionMode, selectMessage, toggleMessage, clearSelection, copySelectedContent } = useMessageSelection()

  const messages = flattenMessages(messagesData)

  const [optimisticMessages, addOptimisticMessage] = useOptimistic<Message[], Message>(
    messages,
    (state, newMessage) => [...state, newMessage]
  )

  const typingUserId = conversationId ? (typingUsers[conversationId] ?? null) : null
  const isTyping = typingUserId !== null && typingUserId !== currentUserId

  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTargetMessages, setDeleteTargetMessages] = useState<Message[]>([])

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

  useEffect(() => {
    if (conversationId) {
      subscribe(conversationId)
    }
  }, [conversationId, subscribe])


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

    const optMessage = buildOptimisticMessage(session, currentUserId, conversationId, {
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

    startTransition(async () => {
      addOptimisticMessage(optMessage)
      await sendMessageMutation.mutateAsync({
        conversationId,
        content,
        replyToId: replyingTo?.id,
        replyToMessage: replyingTo ?? undefined,
      })
    })

    setReplyingTo(null)
  }

  const handleSendAudioMessage = async (blob: Blob, duration: number) => {
    if (!conversationId) return
    sendTypingStop(conversationId)

    const optMessage = buildOptimisticMessage(session, currentUserId, conversationId, {
      content: "🎤 Mensagem de voz",
      type: "audio",
      audioUrl: URL.createObjectURL(blob),
      audioDuration: duration,
    })

    startTransition(async () => {
      addOptimisticMessage(optMessage)
      try {
        const result = await audioUpload.mutateAsync({ blob, duration, conversationId })
        await sendMessageMutation.mutateAsync({
          conversationId,
          content: "🎤 Mensagem de voz",
          type: "audio",
          audioUrl: result.publicUrl,
          audioDuration: duration,
        })
      } catch {
        toast.error("Falha ao enviar áudio", {
          description: "Não foi possível fazer o upload do áudio. Tente novamente.",
          position: "bottom-center",
          className: "mb-24",
        })
      }
    })
  }

  const handleSendImageMessage = async (file: File) => {
    if (!conversationId) return

    const optMessage = buildOptimisticMessage(session, currentUserId, conversationId, {
      type: "image",
      imageUrl: URL.createObjectURL(file),
    })

    startTransition(async () => {
      addOptimisticMessage(optMessage)
      try {
        const result = await imageUpload.mutateAsync({ file, conversationId })
        await sendMessageMutation.mutateAsync({
          conversationId,
          content: "",
          type: "image",
          imageUrl: result.publicUrl,
        })
      } catch {
        toast.error("Falha ao enviar imagem", {
          description: "Não foi possível fazer o upload. Tente novamente.",
          position: "bottom-center",
          className: "mb-24",
        })
      }
    })
  }

  const handleTyping = () => {
    if (conversationId) {
      sendTypingStart(conversationId)
    }
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

    messages: optimisticMessages,

    isTyping,
    replyingTo,
    setReplyingTo,

    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteTargetMessages,
    showDeleteForEveryone: canDeleteForEveryone(deleteTargetMessages, currentUserId),

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
    handleCopySelected,
    handleReplySelected,
    handleLoadMore,
    navigateToChat,
  }
}
