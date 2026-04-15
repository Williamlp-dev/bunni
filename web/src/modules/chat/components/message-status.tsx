import { cn } from "@/lib/utils"
import { Clock, AlertCircle } from "lucide-react"
import type { MessageStatusType } from "@/lib/eden-types"

type MessageStatusVariant = "bubble" | "sidebar"

type MessageStatusProps = {
  status: MessageStatusType
  variant?: MessageStatusVariant
}

function DoubleCheckSvg({
  isRead,
  variant,
}: {
  isRead: boolean
  variant: MessageStatusVariant
}): React.ReactElement {
  const color = isRead
    ? "text-primary"
    : variant === "bubble"
      ? "text-primary-foreground/70"
      : "text-muted-foreground/50"

  return (
    <svg
      width="18"
      height="11"
      viewBox="0 0 18 11"
      className={cn("shrink-0", color)}
      fill="none"
    >
      <path d="M1 5.5L4.5 9L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 5.5L8.5 9L17 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SingleCheckSvg({ variant }: { variant: MessageStatusVariant }): React.ReactElement {
  const color = variant === "bubble" ? "text-primary-foreground/70" : "text-muted-foreground/50"

  return (
    <svg width="14" height="11" viewBox="0 0 14 11" className={cn("shrink-0", color)} fill="none">
      <path d="M1 5.5L4.5 9L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MessageStatus({
  status,
  variant = "sidebar",
}: MessageStatusProps): React.ReactElement | null {
  const clockColor = variant === "bubble" ? "text-primary-foreground/60" : "text-muted-foreground/40"

  if (status === "sending") return (
    <Clock size={14} className={cn("shrink-0 animate-pulse", clockColor)} />
  )
  if (status === "error") return (
    <AlertCircle size={14} className="shrink-0 text-destructive" />
  )
  if (status === "sent") return <SingleCheckSvg variant={variant} />
  if (status === "delivered") return <DoubleCheckSvg isRead={false} variant={variant} />
  if (status === "read") return <DoubleCheckSvg isRead={true} variant={variant} />
  return null
}
