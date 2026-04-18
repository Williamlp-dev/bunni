import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router"
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

export default function Layout() {
  const { session } = Route.useRouteContext()
  const { isNavigating, pathname } = useRouterState({
    select: (s) => ({
      isNavigating: s.status === "pending",
      pathname: s.location.pathname,
    }),
  })

  const isChatWithUsername =
    pathname.startsWith("/chat/") &&
    pathname !== "/chat/" &&
    pathname !== "/chat"

  useGlobalWsEvents(session.user.id)

  const isMobileDetailView =
    isChatWithUsername ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/friends")

  return (
    <GlobalAudioProvider>
      <div className="flex h-dvh bg-background overflow-hidden selection:bg-primary selection:text-primary-foreground">
        <div className="relative z-10 flex w-full h-full">
          <div className="hidden md:flex">
            <VerticalNav />
          </div>

          <div className="w-full md:w-80 shrink-0 h-full">
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
              md:static md:inset-auto md:flex-1 md:h-full
              ${isMobileDetailView ? "max-md:flex" : "max-md:hidden"}
            `}
          >
            <NavigationProgressBar isVisible={isNavigating} />
            <Outlet />
          </div>
        </div>

        {!isChatWithUsername && <MobileBottomNav />}
      </div>
    </GlobalAudioProvider>
  )
}
