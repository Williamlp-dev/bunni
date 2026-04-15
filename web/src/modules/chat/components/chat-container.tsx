import { forwardRef, useCallback, useImperativeHandle } from "react"
import { useStickToBottom } from "use-stick-to-bottom"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export type ChatContainerRootProps = {
  children: React.ReactNode
  className?: string
} & Omit<React.HTMLAttributes<HTMLDivElement>, "ref">

export type ChatContainerContentProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

const ChatContainerRoot = forwardRef<HTMLDivElement, ChatContainerRootProps>(
  ({ children, className, ...props }, ref) => {
    const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom({
      resize: "smooth",
      initial: "instant",
    })

    useImperativeHandle(ref, () => scrollRef.current as HTMLDivElement, [scrollRef])

    const handleScrollToBottom = useCallback(() => {
      scrollToBottom()
    }, [scrollToBottom])

    return (
      <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
        <div
          ref={scrollRef}
          role="log"
          className={cn("flex flex-col overflow-y-auto overflow-x-hidden flex-1", className)}
          {...props}
        >
          <div ref={contentRef} className="flex flex-col">
            {children}
          </div>
        </div>

        <div
          className={cn(
            "absolute bottom-4 right-4 z-10 transition-all duration-200",
            isAtBottom
              ? "opacity-0 translate-y-2 pointer-events-none"
              : "opacity-100 translate-y-0 pointer-events-auto",
          )}
        >
          <button
            type="button"
            onClick={handleScrollToBottom}
            aria-label="Ir para o final"
            className="flex items-center justify-center size-9 rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors"
          >
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    )
  },
)
ChatContainerRoot.displayName = "ChatContainerRoot"

function ChatContainerContent({
  children,
  className,
  ...props
}: ChatContainerContentProps): React.ReactElement {
  return (
    <div className={cn("flex w-full flex-col", className)} {...props}>
      {children}
    </div>
  )
}

export { ChatContainerRoot, ChatContainerContent }
