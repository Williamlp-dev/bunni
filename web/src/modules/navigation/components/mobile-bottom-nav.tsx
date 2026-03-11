import { MessageSquare, User, UserPlus, Users } from "lucide-react"
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { usePendingRequests } from "@/modules/friends/hooks/use-friends"


export function MobileBottomNav(): React.ReactElement | null {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: pendingRequests } = usePendingRequests()

  const activeTab = (() => {
    if (location.pathname.startsWith("/chat")) return "chat"
    if (location.pathname === "/friends" || location.pathname === "/friends/") return "friends"
    if (location.pathname.startsWith("/friends/requests")) return "requests"
    if (location.pathname.startsWith("/profile")) return "profile"
    return "chat"
  })()

  const handleTabChange = (val: string) => {
    const paths: Record<string, string> = {
      chat: "/chat",
      friends: "/friends",
      requests: "/friends/requests",
      profile: "/profile",
    }
    navigate({ to: paths[val] })
  }

  // Só mostra em telas pequenas
  if (window.innerWidth >= 768) return null

  return (
    <nav className="md:hidden flex fixed bottom-3 inset-x-0 justify-center z-50 px-4">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-md p-2 w-full max-w-[360px]"
      >
        <TabsList variant="bubble" className="bg-transparent gap-1 w-full justify-between">
          <TabsTab
            value="chat"
            className="rounded-full h-14 p-0 flex-1 data-[active=true]:text-primary-foreground data-[active=false]:text-muted-foreground"
          >
            <MessageSquare className="size-6" />
          </TabsTab>

          <TabsTab
            value="friends"
            className="rounded-full h-14 p-0 flex-1 data-[active=true]:text-primary-foreground data-[active=false]:text-muted-foreground"
          >
            <UserPlus className="size-6" />
          </TabsTab>

          <TabsTab
            value="requests"
            className="rounded-full h-14 p-0 flex-1 data-[active=true]:text-primary-foreground data-[active=false]:text-muted-foreground relative"
          >
            <Users className="size-6" />
            {pendingRequests && pendingRequests.length > 0 && (
              <span className="absolute top-3 right-5 flex items-center justify-center size-3 rounded-full bg-destructive border-2 border-background" />
            )}
          </TabsTab>

          <TabsTab
            value="profile"
            className="rounded-full h-14 p-0 flex-1 data-[active=true]:text-primary-foreground data-[active=false]:text-muted-foreground"
          >
            <User className="size-6" />
          </TabsTab>
        </TabsList>
      </Tabs>
    </nav>
  )
}
