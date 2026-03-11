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

export function MessageListSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`flex flex-col gap-2 ${i % 2 === 0 ? "items-end" : "items-start"}`}>
          <Skeleton
            className={`h-12 w-3/5 rounded-2xl ${i % 2 === 0 ? "rounded-tr-sm bg-primary/20" : "rounded-tl-sm bg-muted"}`}
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
}: MessageListProps) {
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
          {messages.map((message, index) => {
            const isOwner = message.senderId === currentUserId
            const isDeleted = !!message.deletedAt
            const isSelected = selectedMessageIds?.has(message.id) ?? false

            const prevMessage = messages[index - 1]
            const nextMessage = messages[index + 1]

            const isPrevSameSender = prevMessage?.senderId === message.senderId
            const isNextSameSender = nextMessage?.senderId === message.senderId

            let grouped: "first" | "middle" | "last" | "none" = "none"
            if (isPrevSameSender && isNextSameSender) {
              grouped = "middle"
            } else if (!isPrevSameSender && isNextSameSender) {
              grouped = "first"
            } else if (isPrevSameSender && !isNextSameSender) {
              grouped = "last"
            }

            const handleReplyClick = (messageId: string) => {
              const element = document.getElementById(`message-${messageId}`)
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" })
                // Add temporary highlight
                element.classList.add("bg-primary/10")
                setTimeout(() => {
                  element.classList.remove("bg-primary/10")
                }, 1000)
              }
            }

            const handleClick = () => {
              if (longPressTriggeredRef.current) {
                longPressTriggeredRef.current = false
                return
              }

              if (isSelectionMode) {
                onToggleSelect?.(message)
              }
            }

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={cn(
                  "relative flex items-center group transition-colors duration-500 rounded-lg",
                  isOwner && "flex-row-reverse",
                  grouped === "middle" ? "my-0.5" : grouped === "first" ? "mt-1 mb-0.5" : grouped === "last" ? "mt-0.5 mb-2" : "my-2",
                )}
                onPointerDown={(e) => handlePointerDown(e, message)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
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
                    className="size-5 rounded-full border-muted-foreground/50 data-[state=checked]:border-primary"
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
                    grouped={grouped}
                    showAvatar={!isOwner}
                    avatarFallback={(activeParticipantName || "?").slice(0, 2).toUpperCase()}
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
                              className="inline-flex items-center justify-center p-1.5 rounded-full bg-background/90 border border-border/50 hover:bg-muted cursor-pointer shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ChevronDown className="size-3.5 text-muted-foreground" />
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
          })}

          <div key="typing-indicator" className="mt-4 mb-2"><TypingIndicator visible={isTyping} /></div>
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
            <MessageSquare className="size-16 opacity-20" />
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
          <MessageSquare className="size-16 opacity-20" />
        </EmptyMedia>
        <EmptyTitle>Selecione uma conversa</EmptyTitle>
        <EmptyDescription>Escolha uma conversa na barra lateral para começar</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
