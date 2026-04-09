import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageContent } from "./message"
import { MessageReply } from "./message-reply"
import { AudioPlayer } from "./audio-player"
import { ImagePreview } from "./image-preview"
import { Clock, AlertCircle } from "lucide-react"
import type { MessageStatusType } from "@/lib/eden-types"

function DoubleCheckSvg({ isRead }: { isRead: boolean }): React.ReactElement {
  return (
    <svg
      width="18"
      height="11"
      viewBox="0 0 18 11"
      className={cn("shrink-0", isRead ? "text-primary" : "text-primary-foreground/70")}
      fill="none"
    >
      <path d="M1 5.5L4.5 9L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 5.5L8.5 9L17 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TickIndicator({ status }: { status: MessageStatusType }): React.ReactElement | null {
  if (status === "sending") {
    return <Clock size={14} className="text-primary-foreground/60 shrink-0" />
  }

  if (status === "error") {
    return <AlertCircle size={14} className="text-destructive shrink-0" />
  }

  if (status === "sent") {
    return (
      <svg width="14" height="11" viewBox="0 0 14 11" className="shrink-0 text-primary-foreground/70" fill="none">
        <path d="M1 5.5L4.5 9L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (status === "delivered") return <DoubleCheckSvg isRead={false} />
  if (status === "read") return <DoubleCheckSvg isRead={true} />

  return null
}

export type MessageBubbleProps = {
  content: string
  type?: string
  audioUrl?: string | null
  audioDuration?: number | null
  imageUrl?: string | null
  timestamp?: string
  variant?: "sent" | "received"
  showAvatar?: boolean
  avatarSrc?: string
  avatarFallback?: string
  className?: string
  children?: React.ReactNode
  status?: MessageStatusType
  replyTo?: {
    id: string
    content: string
    senderName: string
    deletedAt: string | null
  }
  actionMenu?: React.ReactNode
  onReplyClick?: (messageId: string) => void
}

export function MessageBubble({
  content,
  type,
  audioUrl,
  audioDuration,
  imageUrl,
  timestamp,
  variant = "received",
  showAvatar = false,
  avatarSrc,
  avatarFallback,
  className,
  children,
  status,
  replyTo,
  actionMenu,
  onReplyClick,
}: MessageBubbleProps): React.ReactElement {
  const isSent = variant === "sent"

  const renderMessageMediaOrContent = () => {
    if (children) return children

    if (type === "audio" && audioUrl) {
      return <AudioPlayer src={audioUrl} duration={audioDuration} variant={variant} />
    }

    if (type === "image" && imageUrl) {
      return <ImagePreview src={imageUrl} variant={variant} />
    }

    return content
  }

  return (
    <div
      className={cn(
        "flex flex-col group",
        isSent ? "items-end" : "items-start",
        className
      )}
    >
      <div className={cn("flex items-end gap-2 max-w-[80%]", isSent && "flex-row-reverse")}>
        {!isSent && showAvatar && (
          <div className="shrink-0">
            <Avatar className="size-8">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback delay={avatarSrc ? 200 : 0} className="text-xs font-bold">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        {!isSent && !showAvatar && (
          <div className="w-8 shrink-0" />
        )}

        <div className="relative group/bubble min-w-0">
          <MessageContent
            className={cn(
              type === "image" && !replyTo
                ? "p-0 bg-transparent shadow-none"
                : isSent
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              "rounded-2xl",
              replyTo && "p-1.5 flex flex-col gap-0.5"
            )}
          >
            {replyTo && (
              <MessageReply
                senderName={replyTo.senderName}
                content={replyTo.content}
                deletedAt={replyTo.deletedAt}
                isReceived={!isSent}
                className="max-w-full"
                onClick={() => onReplyClick?.(replyTo.id)}
              />
            )}
            <div className={cn(replyTo && "px-2 pb-0.5 pt-0.5")}>
              {renderMessageMediaOrContent()}
            </div>
          </MessageContent>

          {actionMenu && (
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10 p-1",
                isSent ? "right-full mr-1" : "left-full ml-1"
              )}
            >
              {actionMenu}
            </div>
          )}
        </div>
      </div>

      {(timestamp || (isSent && status)) && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs text-muted-foreground mt-0.5 px-1",
            isSent ? "mr-1" : "ml-10"
          )}
        >
          {timestamp && <span>{timestamp}</span>}
          {isSent && status && <TickIndicator status={status} />}
        </div>
      )}
    </div>
  )
}
