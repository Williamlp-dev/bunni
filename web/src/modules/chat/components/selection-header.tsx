import { X, Copy, Forward, Reply, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SelectionHeaderProps = {
  selectedCount: number
  onDeselect: () => void
  onCopy: () => void
  onForward?: () => void
  onReply: () => void
  onDelete?: () => void
  className?: string
}

export function SelectionHeader({
  selectedCount,
  onDeselect,
  onCopy,
  onForward,
  onReply,
  onDelete,
  className,
}: SelectionHeaderProps) {
  return (
    <div className="absolute inset-x-0 top-20 z-30 flex justify-center pointer-events-none px-4 sm:px-6">
      <header
        className={cn(
          "pointer-events-auto flex items-center justify-between h-16 w-full max-w-2xl px-2 rounded-2xl",
          "bg-foreground text-background shadow-2xl ring-1 ring-border/10",
          "animate-selection-bar-in will-change-[transform,opacity]",
          className
        )}
      >
        <div className="flex items-center pl-1 pr-4 py-1">
          <Button
            onClick={onDeselect}
            aria-label="Deselecionar"
            variant="ghost"
            size="icon"
            className="text-background hover:bg-background/20 rounded-xl btn-press transition-all duration-(--duration-fast) size-10 mr-3"
          >
            <X className="size-4" />
          </Button>
          <div className="flex flex-col justify-center">
            <span className="text-sm font-semibold leading-none tracking-tight">
              {selectedCount}
            </span>
            <span className="text-[10px] font-medium opacity-70 uppercase tracking-wider leading-none mt-1">
              {selectedCount === 1 ? "Selecionada" : "Selecionadas"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pr-1">
          <Button
            onClick={onCopy}
            aria-label="Copiar mensagens"
            variant="ghost"
            size="icon"
            className="text-background hover:bg-background/20 rounded-xl btn-press transition-all duration-(--duration-fast) size-10"
          >
            <Copy className="size-[18px]" />
          </Button>
          <Button
            onClick={onForward}
            aria-label="Encaminhar mensagens"
            variant="ghost"
            size="icon"
            className="text-background hover:bg-background/20 rounded-xl btn-press transition-all duration-(--duration-fast) size-10"
            disabled={!onForward}
          >
            <Forward className="size-[18px]" />
          </Button>
          {selectedCount === 1 && (
            <Button
              onClick={onReply}
              aria-label="Responder mensagem"
              variant="ghost"
              size="icon"
              className="text-background hover:bg-background/20 rounded-xl btn-press transition-all duration-(--duration-fast) size-10"
            >
              <Reply className="size-[18px]" />
            </Button>
          )}
          {onDelete && (
            <div className="pl-2 ml-1 border-l border-background/20">
              <Button
                onClick={onDelete}
                aria-label="Apagar mensagens"
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/20 hover:text-destructive rounded-xl btn-press transition-all duration-(--duration-fast) size-10"
              >
                <Trash2 className="size-[18px]" />
              </Button>
            </div>
          )}
        </div>
      </header>
    </div>
  )
}
