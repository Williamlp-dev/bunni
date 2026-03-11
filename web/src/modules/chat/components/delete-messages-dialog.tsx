import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

type DeleteMessagesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  showDeleteForEveryone: boolean
  selectedCount: number
  onDeleteForMe: () => void
  onDeleteForEveryone: () => void
}

export function DeleteMessagesDialog({
  open,
  onOpenChange,
  showDeleteForEveryone,
  selectedCount,
  onDeleteForMe,
  onDeleteForEveryone,
}: DeleteMessagesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent bottomStickOnMobile={false} className="w-full sm:max-w-sm p-0 gap-0 overflow-hidden border border-border/40">
        <div className="flex flex-col items-center justify-center p-8 pb-6 text-center">
          <div className="size-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-5 text-destructive ring-1 ring-destructive/20 ring-inset">
            <Trash2 className="size-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">Apagar mensagens</DialogTitle>
          <DialogDescription className="mt-2 text-center text-muted-foreground/80 leading-relaxed">
            {selectedCount === 1
              ? "O que deseja fazer com esta mensagem?"
              : `O que deseja fazer com ${selectedCount} mensagens?`}
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-2 p-6 pt-0">
          {showDeleteForEveryone && (
            <Button
              variant="destructive"
              className="w-full font-medium shadow-none hover:bg-destructive/90"
              onClick={() => {
                onDeleteForEveryone()
                onOpenChange(false)
              }}
            >
              Apagar para todos
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full font-medium bg-background hover:bg-muted/50 border-input/60"
            onClick={() => {
              onDeleteForMe()
              onOpenChange(false)
            }}
          >
            Apagar para mim
          </Button>

          <Button
            variant="ghost"
            className="w-full font-medium text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
