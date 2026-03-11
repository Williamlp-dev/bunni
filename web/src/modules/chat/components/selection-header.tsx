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
    <header
      className={cn(
        "absolute inset-x-0 top-0 z-20 flex h-20 items-center justify-between px-6",
        "bg-primary text-primary-foreground",
        "animate-selection-bar-in will-change-[transform,opacity]",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Button
          onClick={onDeselect}
          aria-label="Deselecionar"
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20 active:scale-95 transition-transform"
        >
          <X className="size-5" />
        </Button>
        <span className="text-sm font-bold uppercase tracking-wide">
          {selectedCount} {selectedCount === 1 ? "selecionada" : "selecionadas"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onCopy}
          aria-label="Copiar mensagens"
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20 active:scale-95 transition-transform"
        >
          <Copy className="size-5" />
        </Button>
        <Button
          onClick={onForward}
          aria-label="Encaminhar mensagens"
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20 active:scale-95 transition-transform"
          disabled={!onForward}
        >
          <Forward className="size-5" />
        </Button>
        {selectedCount === 1 && (
          <Button
            onClick={onReply}
            aria-label="Responder mensagem"
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20 active:scale-95 transition-transform"
          >
            <Reply className="size-5" />
          </Button>
        )}
        {onDelete && (
          <Button
            onClick={onDelete}
            aria-label="Apagar mensagens"
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20 active:scale-95 transition-transform"
          >
            <Trash2 className="size-5" />
          </Button>
        )}
      </div>
    </header>
  )
}
