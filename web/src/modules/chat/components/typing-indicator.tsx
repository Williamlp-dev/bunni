import { useEffect, useState, useRef, type ComponentProps } from "react"
import { cn } from "@/lib/utils"

type TypingIndicatorProps = ComponentProps<"div"> & {
  isTyping?: boolean
  lastMessageId?: string
}

export function TypingIndicator({ 
  className, 
  isTyping = true, 
  lastMessageId, 
  ...props 
}: TypingIndicatorProps): React.ReactElement | null {
  const [shouldRender, setShouldRender] = useState(isTyping)
  const [show, setShow] = useState(false)
  const prevMessageIdRef = useRef(lastMessageId)

  useEffect(() => {
    let hideDelayTimer: ReturnType<typeof setTimeout>

    const messageJustArrived = prevMessageIdRef.current !== lastMessageId
    prevMessageIdRef.current = lastMessageId

    if (isTyping) {
      setShouldRender(true)
      setShow(true)
    } else {
      setShow(false)
      
      if (messageJustArrived) {
        setShouldRender(false)
      } else {
        hideDelayTimer = setTimeout(() => setShouldRender(false), 300)
      }
    }

    return () => {
      clearTimeout(hideDelayTimer)
    }
  }, [isTyping, lastMessageId])

  if (!shouldRender) return null

  return (
    <div
      className={cn(
        "grid transition-all duration-300 ease-out",
        show ? "grid-rows-[1fr] opacity-100 mt-4 mb-2" : "grid-rows-[0fr] opacity-0 mt-0 mb-0",
        className
      )}
    >
      <div className="overflow-hidden">
        <div
          className="flex items-center gap-2 p-4 bg-muted rounded-lg rounded-tl-sm w-fit border border-border"
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
