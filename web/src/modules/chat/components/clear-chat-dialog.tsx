import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eraser } from "lucide-react"

type ClearChatDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ClearChatDialog({ open, onOpenChange, onConfirm }: ClearChatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        bottomStickOnMobile={false}
        className="w-full sm:max-w-sm p-0 gap-0 overflow-hidden border border-border/40 rounded-2xl"
      >
        <div className="flex flex-col items-center justify-center p-8 pb-6 text-center">
          <div className="size-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-5 text-destructive ring-1 ring-destructive/20 ring-inset">
            <Eraser className="size-5" />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Limpar conversa
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-center text-muted-foreground leading-relaxed">
            Todas as mensagens serão apagadas{" "}
            <span className="text-foreground/70 font-medium">apenas para você</span>
            . A conversa continuará para a outra pessoa.
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-2 px-6 pb-6">
          <Button
            variant="destructive"
            className="w-full font-medium shadow-none hover:bg-destructive/90 btn-press"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Limpar para mim
          </Button>

          <Button
            variant="ghost"
            className="w-full font-medium text-muted-foreground hover:text-foreground btn-press"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
