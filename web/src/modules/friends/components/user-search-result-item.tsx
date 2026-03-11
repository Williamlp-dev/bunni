import { UserPlus, Check, Clock, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { UserSearchInfo } from "@/lib/eden-types"

type UserSearchResultItemProps = {
  user: UserSearchInfo
  status: "none" | "pending" | "friend"
  onAdd: () => void
  isLoading: boolean
  index?: number
}

export function UserSearchResultItem({
  user,
  status,
  onAdd,
  isLoading,
}: UserSearchResultItemProps): React.ReactElement {
  const initials =
    user.name?.slice(0, 2).toUpperCase() ||
    user.displayUsername?.slice(0, 2).toUpperCase() ||
    "??"

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={user.image ?? undefined} alt={user.name} />
        <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {user.name}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          @{user.displayUsername}
        </p>
      </div>

      {status === "none" ? (
        <Button
          onClick={onAdd}
          disabled={isLoading}
          size="sm"
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="size-4" />
              Adicionar
            </>
          )}
        </Button>
      ) : (
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium shrink-0 border",
            status === "pending" && "text-muted-foreground border-border bg-muted",
            status === "friend" && "text-primary border-primary/20 bg-primary/10"
          )}
        >
          {status === "pending" ? (
            <>
              <Clock className="size-3.5" />
              Pendente
            </>
          ) : (
            <>
              <Check className="size-3.5" />
              Amigo
            </>
          )}
        </div>
      )}
    </div>
  )
}
