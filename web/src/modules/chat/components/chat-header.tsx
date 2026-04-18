import { useState } from "react"
import { ChevronLeft, MoreVertical, Eraser, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader as PageHeaderUI } from "@/components/ui/page-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu"
import { ClearChatDialog } from "@/modules/chat/components/clear-chat-dialog"
import { useIsOnline } from "@/modules/chat/hooks/use-presence"

type ChatHeaderProps = {
  title: string
  targetUserId?: string
  isVerified?: boolean
  onBack: () => void
  onClearChat: () => void
  onTitleClick?: () => void
}

export function ChatHeader({ title, targetUserId, isVerified, onBack, onClearChat, onTitleClick }: ChatHeaderProps) {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const isOnline = useIsOnline(targetUserId)

  return (
    <>
      <PageHeaderUI
        title={title}
        description={isOnline ? "online" : undefined}
        onTitleClick={onTitleClick}
        titleAdornment={
          isVerified
            ? <BadgeCheck className="size-4 text-primary shrink-0" />
            : undefined
        }
        startContent={
          <Button
            aria-label="Voltar para conversas"
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="rounded-md"
          >
            <ChevronLeft className="size-5" />
          </Button>
        }
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label="Mais opções"
                  variant="ghost"
                  size="icon"
                  className="rounded-md"
                >
                  <MoreVertical className="size-5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44 rounded-lg">
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onClick={() => setIsClearDialogOpen(true)}
              >
                <Eraser className="size-4" />
                Limpar conversa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <ClearChatDialog
        open={isClearDialogOpen}
        onOpenChange={setIsClearDialogOpen}
        onConfirm={onClearChat}
      />
    </>
  )
}
