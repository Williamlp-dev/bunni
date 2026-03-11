import { MessageSquare, UserPlus, Users, User } from "lucide-react"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { usePendingRequests } from "@/modules/friends/hooks/use-friends"
import { Logo } from "@/components/ui/logo"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

type NavItemProps = {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
  className?: string
  badge?: number
}

function NavItem({ icon: Icon, label, active = false, onClick, className, badge }: NavItemProps): React.ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        aria-label={label}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "relative w-full h-12 rounded-none border-none bg-clip-border flex items-center justify-center py-6",
          active
            ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:bg-primary before:rounded-r-full"
            : "text-muted-foreground",
          className
        )}
      >
        <Icon className="size-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center size-5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        <p className="text-sm font-medium">{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function VerticalNav(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: pendingRequests } = usePendingRequests()

  const isMessagesActive = location.pathname.startsWith("/chat")
  const isAddFriendsActive = location.pathname === "/friends" || location.pathname === "/friends/"
  const isRequestsActive = location.pathname.startsWith("/friends/requests")
  const isProfileActive = location.pathname.startsWith("/profile")

  return (
    <TooltipProvider delay={150}>
      <nav className="w-16 h-full bg-background border-r border-border flex flex-col items-center py-4 shrink-0 z-20">
        <div className="mb-6">
          <Logo size="sm" iconOnly />
        </div>

        <div className="flex-1 flex flex-col w-full">
          <NavItem
            icon={MessageSquare}
            label="Mensagens"
            active={isMessagesActive}
            onClick={() => navigate({ to: "/chat" })}
          />
          <NavItem
            icon={UserPlus}
            label="Adicionar"
            active={isAddFriendsActive}
            onClick={() => navigate({ to: "/friends" })}
          />
          <NavItem
            icon={Users}
            label="Pedidos"
            active={isRequestsActive}
            onClick={() => navigate({ to: "/friends/requests" })}
            badge={pendingRequests?.length}
          />
          <NavItem
            icon={User}
            label="Perfil"
            active={isProfileActive}
            onClick={() => navigate({ to: "/profile" })}
          />
        </div>

        <div className="flex flex-col items-center gap-4 w-full">

          <div className="flex items-center justify-center w-full">
            <ThemeToggle />
          </div>


        </div>
      </nav>
    </TooltipProvider>
  )
}
