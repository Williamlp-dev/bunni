import { Check, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Request } from "@/lib/eden-types"

type FriendRequestCardProps = {
  request: Request
  onAccept: () => void
  onReject: () => void
  index?: number
}

export function FriendRequestCard({
  request,
  onAccept,
  onReject,
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
          variant="outline"
          size="icon"
          className="size-9 rounded-lg"
          aria-label="Recusar pedido"
        >
          <X className="size-4" />
        </Button>
        <Button
          onClick={onAccept}
          size="icon"
          className="size-9 rounded-lg"
          aria-label="Aceitar pedido"
        >
          <Check className="size-4" strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  )
}
