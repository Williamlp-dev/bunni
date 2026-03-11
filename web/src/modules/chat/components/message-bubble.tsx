import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageContent } from "./message"
import { MessageReply } from "./message-reply"
import { AudioPlayer } from "./audio-player"
import { ImagePreview } from "./image-preview"

export type MessageBubbleProps = {
  content: string
  type?: string
  audioUrl?: string | null
  audioDuration?: number | null
  imageUrl?: string | null
  timestamp?: string
  variant?: "sent" | "received"
  grouped?: "first" | "middle" | "last" | "none"
  showAvatar?: boolean
  avatarSrc?: string
  avatarFallback?: string
  className?: string
  children?: React.ReactNode
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
  grouped = "none",
  showAvatar = false,
  avatarSrc,
  avatarFallback,
  className,
  children,
  replyTo,
  actionMenu,
  onReplyClick,
}: MessageBubbleProps) {
  const isSent = variant === "sent"

  const radiusMap = {
    first: isSent ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm",
    middle: isSent ? "rounded-2xl rounded-r-sm" : "rounded-2xl rounded-l-sm",
    last: isSent ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm",
    none: "rounded-2xl",
  }

  const radiusClass = radiusMap[grouped] || "rounded-2xl"

  return (
    <div
      className={cn(
        "flex flex-col group",
        isSent ? "items-end" : "items-start",
        grouped === "middle" && "my-0.5",
        className
      )}
    >
      <div className={cn("flex items-end gap-2 max-w-[80%]", isSent && "flex-row-reverse")}>
        {!isSent && showAvatar && (
          <div className="shrink-0">
            <Avatar className="size-8">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback className="text-xs font-bold">
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
              isSent
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
              radiusClass,
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
              {children || (type === "audio" && audioUrl ? (
                <AudioPlayer
                  src={audioUrl}
                  duration={audioDuration}
                  variant={variant}
                />
              ) : type === "image" && imageUrl ? (
                <ImagePreview src={imageUrl} variant={variant} />
              ) : (
                content
              ))}
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

      {timestamp && (
        <div
          className={cn(
            "text-xs text-muted-foreground mt-0.5 px-1",
            isSent ? "mr-1" : "ml-10"
          )}
        >
          {timestamp}
        </div>
      )}
    </div>
  )
}
