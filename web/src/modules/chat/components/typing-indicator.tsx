import { type ComponentProps } from "react"
import { cn } from "@/lib/utils"

type TypingIndicatorProps = ComponentProps<"div"> & {
  visible?: boolean
}

export function TypingIndicator({
  className,
  visible = true,
  ...props
}: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "grid transition-all duration-200 ease-out",
        visible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            "flex items-center gap-2 p-4 bg-muted rounded-lg rounded-tl-sm w-fit border border-border",
            className,
          )}
          {...props}
        >
          <span className="size-2 rounded-full bg-muted-foreground animate-typing-dot [animation-delay:0s]" />
          <span className="size-2 rounded-full bg-muted-foreground animate-typing-dot [animation-delay:0.16s]" />
          <span className="size-2 rounded-full bg-muted-foreground animate-typing-dot [animation-delay:0.32s]" />
        </div>
      </div>
    </div>
  )
}
