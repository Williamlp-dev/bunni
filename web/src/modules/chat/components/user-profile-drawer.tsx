import { Drawer } from "vaul"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Ban, ShieldOff, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBlockUser, useUnblockUser } from "@/modules/profile/hooks/use-block-user"
import { getUserInitials } from "@/modules/auth/hooks/use-current-user"

type TargetUser = {
  id: string
  name: string | null
  image: string | null
  username: string
  displayUsername: string
  bio?: string | null
  isVerified?: boolean
}

type UserProfileDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: TargetUser
  isBlocked: boolean
}


export function UserProfileDrawer({ open, onOpenChange, user, isBlocked }: UserProfileDrawerProps) {
  const initials = getUserInitials(user.name ?? user.username)
  const blockUser = useBlockUser()
  const unblockUser = useUnblockUser()

  const handleBlockToggle = () => {
    if (isBlocked) {
      unblockUser.mutate(user.id)
    } else {
      blockUser.mutate(user.id)
    }
    // Fechar após a ação
    onOpenChange(false)
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-300" />
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 flex flex-col outline-none",
            "rounded-t-[32px] bg-card border-t border-border/50 shadow-2xl h-fit",
            "after:absolute after:inset-x-0 after:-bottom-full after:h-full after:bg-card"
          )}
        >
          {/* Handle Central */}
          <Drawer.Handle className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20" />

          <div className="flex flex-col items-center px-6 pb-12 pt-8 w-full max-w-lg mx-auto">
            {/* Cabeçalho */}
            <div className="flex flex-col items-center text-center w-full mb-8">
              <Avatar className="size-32 text-4xl shadow-xl border-4 border-card ring-2 ring-border mb-6">
                {user.image && (
                  <AvatarImage src={user.image} alt={user.name ?? user.username} />
                )}
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <Drawer.Title className="flex items-center gap-2 justify-center text-3xl font-bold tracking-tight text-foreground mb-1 leading-tight">
                {user.name ?? user.username}
                {user.isVerified && <BadgeCheck className="size-6 text-primary shrink-0" />}
              </Drawer.Title>
              <Drawer.Description className="text-base text-muted-foreground font-medium">
                @{user.displayUsername}
              </Drawer.Description>
            </div>

            {/* Texto da Bio - Compacto para evitar scroll */}
            {user.bio && (
              <div className="relative w-full max-w-[340px] mb-10 px-6">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-primary/30" />
                <p className="text-lg text-foreground/90 font-medium leading-relaxed italic text-left line-clamp-3">
                  {user.bio}
                </p>
              </div>
            )}

            {/* Espaçador Flex removido para fixar h-fit */}

            {/* Ação Principal - Botão Gordinho */}
            <div className="w-full flex flex-col items-center gap-4 safe-bottom">
              <Button
                variant={isBlocked ? "outline" : "destructive"}
                className={cn(
                  "btn-press h-16 px-10 gap-3 rounded-full font-bold text-lg transition-all w-fit min-w-[220px]",
                  isBlocked ? "border-2 border-border/80" : "shadow-brand bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={handleBlockToggle}
                disabled={blockUser.isPending || unblockUser.isPending}
              >
                {isBlocked ? (
                  <>
                    <ShieldOff className="size-5" />
                    Desbloquear
                  </>
                ) : (
                  <>
                    <Ban className="size-5" />
                    Bloquear
                  </>
                )}
              </Button>

            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
