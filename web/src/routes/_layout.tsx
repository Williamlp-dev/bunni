import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router"
import { useRef } from "react"
import { sessionQueryOptions } from "@/lib/auth"
import { queryClient } from "@/lib/query-client"
import { VerticalNav } from "@/modules/navigation/components/vertical-nav"
import { MobileBottomNav } from "@/modules/navigation/components/mobile-bottom-nav"
import { ConversationSidebar } from "@/modules/chat/components/conversation-sidebar"
import { useGlobalWsEvents } from "@/hooks/use-global-ws-events"
import { NavigationProgressBar } from "@/modules/navigation/components/navigation-progress-bar"
import { GlobalAudioProvider } from "@/modules/chat/hooks/use-global-audio.tsx"
import { SplashScreen } from "@/components/ui/splash-screen"

export const Route = createFileRoute("/_layout")({
  beforeLoad: async () => {
    const session = await queryClient.fetchQuery(sessionQueryOptions)

    if (!session?.user) {
      throw redirect({
        to: "/sign-in",
      })
    }

    return {
      session,
    }
  },
  staleTime: Infinity,
  component: Layout,
  pendingComponent: SplashScreen,
})

const TAB_ORDER = ["/chat", "/friends", "/friends/requests", "/profile"]

const getTabIndex = (pathname: string): number => {
  if (
    pathname.startsWith("/chat/") &&
    pathname !== "/chat/" &&
    pathname !== "/chat"
  )
    return -1
  const match = TAB_ORDER.findIndex((tab) => {
    if (tab === "/friends/requests") return pathname.startsWith("/friends/requests")
    if (tab === "/friends") return pathname === "/friends" || pathname === "/friends/"
    return pathname.startsWith(tab)
  })
  return match
}

const isDetailPath = (pathname: string): boolean => {
  if (
    pathname.startsWith("/chat/") &&
    pathname !== "/chat/" &&
    pathname !== "/chat"
  )
    return true
  return (
    pathname.startsWith("/friends") ||
    pathname.startsWith("/profile")
  )
}

export default function Layout() {
  const { session } = Route.useRouteContext()
  const { isNavigating, pathname } = useRouterState({
    select: (s) => ({
      isNavigating: s.status === "pending",
      pathname: s.location.pathname,
    }),
  })
  useGlobalWsEvents()

  const isChatWithUsername =
    pathname.startsWith("/chat/") &&
    pathname !== "/chat/" &&
    pathname !== "/chat"
  const isProfile = pathname.startsWith("/profile")
  const isFriends = pathname.startsWith("/friends")
  const isMobileDetailView = isChatWithUsername || isProfile || isFriends

  const prevPathnameRef = useRef(pathname)
  const prevIndexRef = useRef<number>(getTabIndex(pathname))
  const prevWasDetailRef = useRef<boolean>(isDetailPath(pathname))
  const slideDirectionRef = useRef<"right" | "left" | null>(null)

  if (pathname !== prevPathnameRef.current) {
    const currentIndex = getTabIndex(pathname)
    const prevIndex = prevIndexRef.current
    const prevWasDetail = prevWasDetailRef.current

    if (
      !prevWasDetail ||
      currentIndex === -1 ||
      prevIndex === -1 ||
      currentIndex === prevIndex
    ) {
      slideDirectionRef.current = null
    } else {
      slideDirectionRef.current = currentIndex > prevIndex ? "right" : "left"
    }

    prevIndexRef.current = currentIndex
    prevWasDetailRef.current = isDetailPath(pathname)
    prevPathnameRef.current = pathname
  }

  const slideDirection = slideDirectionRef.current
  const animKey = pathname

  const slideClass =
    slideDirection === "right"
      ? "animate-page-slide-from-right"
      : slideDirection === "left"
        ? "animate-page-slide-from-left"
        : ""

  return (
    <GlobalAudioProvider>
      <div className="flex h-dvh bg-background overflow-hidden selection:bg-primary selection:text-primary-foreground">
        <div className="relative z-10 flex w-full h-full">
          <div className="hidden md:flex">
            <VerticalNav />
          </div>

          <div
            className={`
              w-full md:w-80 shrink-0 h-full
              md:translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
              ${isMobileDetailView ? "max-md:-translate-x-[20%]" : "max-md:translate-x-0"}
            `}
          >
            <ConversationSidebar
              user={session.user}
              activeUsername={
                isChatWithUsername ? pathname.split("/").pop() : undefined
              }
            />
          </div>

          <div
            className={`
              fixed inset-0 z-20 h-dvh bg-background w-full overflow-hidden
              md:static md:inset-auto md:flex-1 md:h-full md:translate-x-0
              transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
              ${isMobileDetailView ? "translate-x-0" : "translate-x-full md:translate-x-0"}
            `}
          >
            <NavigationProgressBar isVisible={isNavigating} />
            <div
              key={animKey}
              className={`w-full h-full md:animate-none ${slideClass}`}
            >
              <Outlet />
            </div>
          </div>
        </div>

        {!isChatWithUsername && <MobileBottomNav />}
      </div>
    </GlobalAudioProvider>
  )
}
