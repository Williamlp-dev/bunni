import { Check, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Request } from "@/lib/eden-types"

type FriendRequestCardProps = {
  request: Request
  onAccept: () => void
  onReject: () => void
  isAccepting?: boolean
  isRejecting?: boolean
  index?: number
}

export function FriendRequestCard({
  request,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
}: FriendRequestCardProps): React.ReactElement | null {
  const sender = request.sender
  if (!sender) return null

  const initials = sender.name?.slice(0, 2).toUpperCase() ?? "U"
  const username = sender.displayUsername || sender.username

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={sender.image ?? undefined} alt={sender.name} />
        <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {sender.name}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          @{username}
        </p>
      </div>

      <div className="flex gap-2 shrink-0">
        <Button
          onClick={onReject}
          disabled={isAccepting || isRejecting}
          variant="outline"
          size="icon"
          className="size-9 rounded-lg"
          aria-label="Recusar pedido"
        >
          {isRejecting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
        </Button>
        <Button
          onClick={onAccept}
          disabled={isAccepting || isRejecting}
          size="icon"
          className="size-9 rounded-lg"
          aria-label="Aceitar pedido"
        >
          {isAccepting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" strokeWidth={2.5} />
          )}
        </Button>
      </div>
    </div>
  )
}
