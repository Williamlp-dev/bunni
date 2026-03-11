import { cn } from "@/lib/utils"

type MessageReplyProps = {
  senderName: string
  content: string
  deletedAt?: string | null
  isReceived?: boolean
  className?: string
  onClick?: () => void
}

export function MessageReply({
  senderName,
  content,
  deletedAt,
  isReceived = true,
  className,
  onClick,
}: MessageReplyProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={cn(
        "flex flex-col gap-0.5 rounded-md px-3 py-2 text-xs select-none border-l-4 transition-opacity hover:opacity-80 active:opacity-50 cursor-pointer overflow-hidden",
        isReceived
          ? "bg-black/5 dark:bg-white/5 border-primary text-foreground"
          : "bg-black/20 border-primary-foreground/50 text-primary-foreground",
        className
      )}
    >
      <div className="font-bold truncate flex items-center gap-1">
        <span className={cn(
          isReceived ? "text-primary" : "text-primary-foreground"
        )}>
          {senderName}
        </span>
      </div>
      <span className="truncate opacity-80 font-normal">
        {deletedAt ? <span className="italic">Mensagem apagada</span> : content}
      </span>
    </div>
  )
}
