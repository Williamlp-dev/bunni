import { cn } from "@/lib/utils"

export type OnlineStatusIndicatorProps = {
  status?: "online" | "offline" | "away"
  size?: "sm" | "md" | "lg"
  className?: string
  showPulse?: boolean
}

const sizeClasses = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3",
}

const statusClasses = {
  online: "bg-green-500",
  offline: "bg-muted-foreground/40",
  away: "bg-yellow-500",
}

export function OnlineStatusIndicator({
  status = "offline",
  size = "sm",
  className,
  showPulse = true,
}: OnlineStatusIndicatorProps) {
  const shouldPulse = status === "online" && showPulse

  return (
    <span className={cn("relative inline-flex", className)}>
      <span
        className={cn(
          "rounded-full border-2 border-background",
          sizeClasses[size],
          statusClasses[status]
        )}
      />
      {shouldPulse && (
        <span
          className={cn(
            "absolute inline-flex rounded-full opacity-75 animate-ping",
            sizeClasses[size],
            statusClasses[status]
          )}
        />
      )}
    </span>
  )
}
