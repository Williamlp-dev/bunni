import { CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OnlineStatusIndicator } from "@/components/ui/online-status-indicator"

type ConversationItemProps = {
  name: string
  lastMessage?: string
  timestamp: string
  avatarSrc?: string
  unreadCount?: number
  isRead?: boolean
  isOnline?: boolean
  state?: "default" | "active" | "unread"
  onClick?: () => void
  className?: string
}

export function ConversationItem({
  name,
  lastMessage,
  timestamp,
  avatarSrc,
  unreadCount,
  isRead,
  isOnline,
  state = "default",
  onClick,
  className,
}: ConversationItemProps): React.ReactElement {
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
      <div className="relative shrink-0">
        <Avatar className="size-10">
          <AvatarImage src={avatarSrc} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        {isOnline !== undefined && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <OnlineStatusIndicator
              status={isOnline ? "online" : "offline"}
              size="sm"
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "truncate font-semibold text-sm tracking-tight",
              state === "active" ? "text-primary" : "text-foreground",
              state === "unread" && "text-foreground"
            )}
          >
            {name}
          </span>
          <span className="shrink-0 text-xs font-medium text-muted-foreground/70 tabular-nums">
            {timestamp}
          </span>
        </div>

        {lastMessage && (
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-xs flex items-center gap-1.5 leading-snug",
                state === "unread"
                  ? "font-semibold text-foreground/90"
                  : "font-normal text-muted-foreground/80"
              )}
            >
              {isRead !== undefined && (
                <CheckCheck
                  className={cn(
                    "size-3.5 shrink-0",
                    isRead ? "text-primary" : "text-muted-foreground/40"
                  )}
                />
              )}
              {lastMessage}
            </span>
            {unreadCount && unreadCount > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center bg-primary px-2 text-xs font-bold text-primary-foreground rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
