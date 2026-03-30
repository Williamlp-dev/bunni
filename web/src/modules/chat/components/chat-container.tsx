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

function supportsScrollBehavior(): boolean {
  return "scrollBehavior" in document.documentElement.style
}

function useStickToBottom(containerRef: RefObject<HTMLDivElement | null>) {
  const isStuckRef = useRef(true)
  const isInitialRef = useRef(true)
  const rafIdRef = useRef<number | null>(null)

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = containerRef.current
      if (!el) return
      isStuckRef.current = true
      const resolvedBehavior = supportsScrollBehavior() ? behavior : "auto"
      el.scrollTo({ top: el.scrollHeight, behavior: resolvedBehavior })
    },
    [containerRef],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (isInitialRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "instant" })
      isInitialRef.current = false
    }

    const scheduleScroll = (behavior: ScrollBehavior) => {
      if (!isStuckRef.current) return
      if (rafIdRef.current !== null) return
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        if (!isStuckRef.current) return
        const container = containerRef.current
        if (!container) return
        const resolvedBehavior = supportsScrollBehavior() ? behavior : "auto"
        container.scrollTo({ top: container.scrollHeight, behavior: resolvedBehavior })
      })
    }

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - Math.ceil(el.scrollTop) - el.clientHeight
      isStuckRef.current = distanceFromBottom < 150
    }

    const resizeObserver = new ResizeObserver(() => scheduleScroll("smooth"))

    const mutationObserver = new MutationObserver(() => {
      scheduleScroll("smooth")
    })

    mutationObserver.observe(el, { childList: true, subtree: true })

    const content = el.firstElementChild
    if (content) {
      resizeObserver.observe(content)
    }

    el.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      el.removeEventListener("scroll", handleScroll)
      mutationObserver.disconnect()
      resizeObserver.disconnect()
    }
  }, [containerRef])

  return { scrollToBottom }
}


function ChatContainerRoot({
  children,
  className,
  ...props
}: ChatContainerRootProps): React.ReactElement {
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
}: ChatContainerContentProps): React.ReactElement {
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
}: ChatContainerScrollAnchorProps): React.ReactElement {
  return (
    <div
      className={cn("h-px w-full shrink-0", className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor }
