import { useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { DateDivider } from "./date-divider"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageBubble } from "./message-bubble"
import { TypingIndicator } from "./typing-indicator"
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@/components/ui/menu"
import { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor } from "./chat-container"

import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty-state'
import { MessageSquare, Trash2, Ban, ChevronDown, Reply, Loader2, CheckSquare } from "lucide-react"
import { formatTimestamp } from "@/modules/chat/utils/chat-utils"
import type { Message } from "@/lib/eden-types"

type MessageListProps = {
  messages: Message[]
  activeConversationId: string | null
  currentUserId: string
  activeParticipantName?: string
  isTyping: boolean
  onReply: (message: Message) => void
  onDeleteRequest: (messages: Message[]) => void
  onEnterSelectionMode?: (message: Message) => void
  onToggleSelect?: (message: Message) => void
  selectedMessageIds?: Set<string>
  isSelectionMode?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
}

type MessageItemProps = {
  message: Message
  currentUserId: string
  activeParticipantName?: string
  isSelected: boolean
  isSelectionMode: boolean
  onReply: (message: Message) => void
  onDeleteRequest: (messages: Message[]) => void
  onEnterSelectionMode?: (message: Message) => void
  onToggleSelect?: (message: Message) => void
  onContentPointerDown: (e: React.PointerEvent) => void
  onContentPointerUp: () => void
  onContentPointerLeave: () => void
  isLongPressTriggered: () => boolean
  resetLongPressTrigger: () => void
}

function MessageItem({
  message,
  currentUserId,
  activeParticipantName,
  isSelected,
  isSelectionMode,
  onReply,
  onDeleteRequest,
  onEnterSelectionMode,
  onToggleSelect,
  onContentPointerDown,
  onContentPointerUp,
  onContentPointerLeave,
  isLongPressTriggered,
  resetLongPressTrigger
}: MessageItemProps): React.ReactElement {
  const isOwner = message.senderId === currentUserId
  const isDeleted = !!message.deletedAt

  const handleReplyClick = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.classList.add("bg-primary/10")
      setTimeout(() => {
        element.classList.remove("bg-primary/10")
      }, 1000)
    }
  }

  const handleClick = () => {
    if (isLongPressTriggered()) {
      resetLongPressTrigger()
      return
    }

    if (isSelectionMode) {
      onToggleSelect?.(message)
    }
  }

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "relative flex items-center group transition-colors duration-500 rounded-lg py-1 animate-message-slide-up",
        isOwner && "flex-row-reverse",
      )}
      onPointerDown={onContentPointerDown}
      onPointerUp={onContentPointerUp}
      onPointerLeave={onContentPointerLeave}
      onClick={handleClick}
    >
      <div
        className={cn(
          "absolute inset-y-0 -inset-x-4 pointer-events-none transition-opacity duration-150 ease-out bg-primary/10",
          isSelected ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 overflow-hidden transition-[width,margin-right,opacity] duration-300 ease-ios",
          isSelectionMode ? "w-6 mr-2 opacity-100" : "w-0 mr-0 opacity-0 pointer-events-none"
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect?.(message)}
          className="size-5 rounded-full border-input data-[state=checked]:border-primary"
        />
      </div>
      <div className="relative flex-1 min-w-0">
        <MessageBubble
          content={message.content}
          type={message.type}
          audioUrl={message.audioUrl}
          audioDuration={message.audioDuration}
          imageUrl={message.imageUrl}
          variant={isOwner ? "sent" : "received"}
          timestamp={formatTimestamp(message.createdAt)}
          showAvatar={!isOwner}
          avatarSrc={message.sender?.image || undefined}
          avatarFallback={(message.sender?.name || message.sender?.displayUsername || activeParticipantName || "?").slice(0, 2).toUpperCase()}
          replyTo={message.replyTo ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            senderName: message.replyTo.sender?.name ?? message.replyTo.sender?.displayUsername ?? "Usuário",
            deletedAt: message.replyTo.deletedAt
          } : undefined}
          onReplyClick={handleReplyClick}
          actionMenu={
            !isSelectionMode ? (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                <Menu>
                  <MenuTrigger
                    className="inline-flex items-center justify-center p-2 rounded-full bg-background border border-border hover:bg-muted cursor-pointer shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </MenuTrigger>
                  <MenuPopup
                    align={isOwner ? "end" : "start"}
                    sideOffset={4}
                    collisionPadding={{ bottom: 80 }}
                  >
                    {!isDeleted && (
                      <MenuItem onClick={() => onReply(message)}>
                        <Reply className="size-4" />
                        Responder
                      </MenuItem>
                    )}
                    <MenuItem onClick={() => onEnterSelectionMode?.(message)}>
                      <CheckSquare className="size-4" />
                      Selecionar
                    </MenuItem>
                    <MenuItem
                      variant="destructive"
                      onClick={() => onDeleteRequest([message])}
                    >
                      <Trash2 className="size-4" />
                      Apagar
                    </MenuItem>
                  </MenuPopup>
                </Menu>
              </div>
            ) : undefined
          }
        >
          {isDeleted && (<div className="flex items-center gap-2 italic opacity-80"><Ban className="size-4" /><span>Mensagem apagada</span></div>)}
        </MessageBubble>
      </div>
    </div>
  )
}

export function MessageListSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`flex flex-col gap-2 ${i % 2 === 0 ? "items-end" : "items-start"}`}>
          <Skeleton
            className={`h-12 w-3/5 rounded-2xl ${i % 2 === 0 ? "bg-muted" : "bg-card"}`}
          />
          <Skeleton className="h-3 w-16 opacity-50" />
        </div>
      ))}
    </div>
  )
}

export function MessageList({
  messages,
  activeConversationId,
  currentUserId,
  activeParticipantName,
  isTyping,
  onReply,
  onDeleteRequest,
  onEnterSelectionMode,
  onToggleSelect,
  selectedMessageIds,
  isSelectionMode,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: MessageListProps): React.ReactElement {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent, message: Message) => {
    if (e.pointerType !== "touch") return
    longPressTriggeredRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      onEnterSelectionMode?.(message)
    }, 500)
  }, [onEnterSelectionMode])

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  if (messages.length > 0) {
    return (
      <ChatContainerRoot
        className="flex-1 min-h-0 selection:bg-foreground selection:text-background overflow-x-hidden"
      >
        <ChatContainerContent className="flex-col min-h-full gap-0 px-4 py-4">
          {hasNextPage && (
            <div className="flex justify-center pb-4">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  "Carregar mensagens anteriores"
                )}
              </button>
            </div>
          )}
          <div className="flex-1" />
          <DateDivider date="Hoje" />
          <div className="h-6" />
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              activeParticipantName={activeParticipantName}
              isSelected={selectedMessageIds?.has(message.id) ?? false}
              isSelectionMode={isSelectionMode ?? false}
              onReply={onReply}
              onDeleteRequest={onDeleteRequest}
              onEnterSelectionMode={onEnterSelectionMode}
              onToggleSelect={onToggleSelect}
              onContentPointerDown={(e) => handlePointerDown(e, message)}
              onContentPointerUp={handlePointerUp}
              onContentPointerLeave={handlePointerUp}
              isLongPressTriggered={() => longPressTriggeredRef.current}
              resetLongPressTrigger={() => { longPressTriggeredRef.current = false }}
            />
          ))}

          <TypingIndicator 
            isTyping={isTyping} 
            lastMessageId={messages[messages.length - 1]?.id} 
          />
          <ChatContainerScrollAnchor />
        </ChatContainerContent>
      </ChatContainerRoot>
    )
  }

  if (activeConversationId) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <MessageSquare className="size-16 text-muted-foreground/50" />
          </EmptyMedia>
          <EmptyTitle>Nenhuma mensagem</EmptyTitle>
          <EmptyDescription>Envie uma mensagem para iniciar a conversa</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <MessageSquare className="size-16 text-muted-foreground/50" />
        </EmptyMedia>
        <EmptyTitle>Selecione uma conversa</EmptyTitle>
        <EmptyDescription>Escolha uma conversa na barra lateral para começar</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
