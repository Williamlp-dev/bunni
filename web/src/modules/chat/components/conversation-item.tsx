import { memo } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageStatus } from "@/modules/chat/components/message-status"
import { getUserInitials } from "@/modules/auth/hooks/use-current-user"
import type { MessageStatusType } from "@/lib/eden-types"
import { BadgeCheck } from "lucide-react"

type ConversationItemProps = {
  name: string
  lastMessage?: string
  lastMessageType?: "text" | "audio" | "image"
  lastMessageSenderId?: string
  currentUserId?: string
  messageStatus?: MessageStatusType
  timestamp: string
  avatarSrc?: string
  unreadCount?: number
  isTyping?: boolean
  state?: "default" | "active" | "unread"
  isVerified?: boolean
  onClick?: () => void
  className?: string
}

function ConversationItemInner({
  name,
  lastMessage,
  lastMessageType,
  lastMessageSenderId,
  currentUserId,
  messageStatus,
  timestamp,
  avatarSrc,
  unreadCount,
  isTyping = false,
  state = "default",
  isVerified = false,
  onClick,
  className,
}: ConversationItemProps): React.ReactElement {
  const isMine = lastMessageSenderId === currentUserId
  const hasUnread = (unreadCount ?? 0) > 0

  const previewText = (): string => {
    if (lastMessageType === "image") return "📷 Foto"
    if (lastMessageType === "audio") return "🎤 Áudio"
    return lastMessage ?? ""
  }

  const preview = previewText()

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 px-4 h-16 w-full cursor-pointer text-left border-b border-border/40 last:border-0",
        state === "active" && [
          "bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:bg-primary before:rounded-r-full",
        ],
        state === "default" && [
          "hover:bg-secondary/20",
        ],
        state === "unread" && [
          "bg-accent/20 hover:bg-accent/30",
        ],
        className
      )}
    >
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={avatarSrc} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary">{getUserInitials(name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className={cn(
                "truncate font-semibold text-sm tracking-tight",
                state === "active" ? "text-primary" : "text-foreground",
              )}
            >
              {name}
            </span>
            {isVerified && (
              <BadgeCheck className="size-3.5 text-primary shrink-0" />
            )}
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground/70 tabular-nums">
            {timestamp}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {isTyping ? (
            <span
              key="typing"
              className="truncate text-xs font-medium text-primary animate-conversation-preview-in"
            >
              digitando...
            </span>
          ) : (
            <span
              key={preview}
              className={cn(
                "truncate text-xs flex items-center gap-1 leading-snug animate-conversation-preview-in",
                state === "unread"
                  ? "font-semibold text-foreground/90"
                  : "font-normal text-muted-foreground/80"
              )}
            >
              {isMine && messageStatus && (
                <span className="shrink-0">
                  <MessageStatus status={messageStatus} />
                </span>
              )}
              {preview}
            </span>
          )}

          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center bg-primary px-1.5 text-xs font-bold text-primary-foreground rounded-full">
              {unreadCount! > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export const ConversationItem = memo(ConversationItemInner)
