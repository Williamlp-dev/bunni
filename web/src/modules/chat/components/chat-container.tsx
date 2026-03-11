import { useRef, useEffect, useCallback, type RefObject } from "react"
import { cn } from "@/lib/utils"

export type ChatContainerRootProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

export type ChatContainerContentProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>

export type ChatContainerScrollAnchorProps = {
  className?: string
  ref?: React.RefObject<HTMLDivElement>
} & React.HTMLAttributes<HTMLDivElement>

function useStickToBottom(containerRef: RefObject<HTMLDivElement | null>) {
  const isStuckRef = useRef(true)
  const isInitialRef = useRef(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [containerRef])

  const checkIfStuck = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const threshold = 40
    isStuckRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }, [containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (isInitialRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "instant" })
      isInitialRef.current = false
    }

    const observer = new MutationObserver(() => {
      if (isStuckRef.current) {
        scrollToBottom("smooth")
      }
    })

    observer.observe(el, { childList: true, subtree: true, characterData: true })

    const handleScroll = () => {
      checkIfStuck()
    }

    el.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      el.removeEventListener("scroll", handleScroll)
    }
  }, [containerRef, scrollToBottom, checkIfStuck])

  return { scrollToBottom }
}

function ChatContainerRoot({
  children,
  className,
  ...props
}: ChatContainerRootProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useStickToBottom(containerRef)

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col overflow-y-auto overflow-x-hidden", className)}
      role="log"
      {...props}
    >
      {children}
    </div>
  )
}

function ChatContainerContent({
  children,
  className,
  ...props
}: ChatContainerContentProps) {
  return (
    <div
      className={cn("flex w-full flex-col", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function ChatContainerScrollAnchor({
  className,
  ...props
}: ChatContainerScrollAnchorProps) {
  return (
    <div
      className={cn("h-px w-full shrink-0", className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor }
