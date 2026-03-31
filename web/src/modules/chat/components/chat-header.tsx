import { ChevronLeft, MoreVertical, Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader as PageHeaderUI } from "@/components/ui/page-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu"
import { ClearChatDialog } from "@/modules/chat/components/clear-chat-dialog"
import { useState } from "react"

type ChatHeaderProps = {
  title: string
  onBack: () => void
  onClearChat: () => void
}

export function ChatHeader({ title, onBack, onClearChat }: ChatHeaderProps) {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)

  return (
    <>
      <PageHeaderUI
        title={title}
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
