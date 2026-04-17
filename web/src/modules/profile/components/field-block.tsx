import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FieldBlockProps = {
  label: string
  isEditing: boolean
  onEdit: () => void
  display: React.ReactNode
  editor: React.ReactNode
}

export function FieldBlock({ label, isEditing, onEdit, display, editor }: FieldBlockProps) {
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onEdit}
            className="btn-press size-5 text-muted-foreground/50 hover:text-foreground"
          >
            <Pencil className="size-3" />
          </Button>
        )}
      </div>

      <div
        className={cn("transition-all duration-200", isEditing && "animate-in fade-in slide-in-from-top-1")}
        key={isEditing ? "editing" : "display"}
      >
        {isEditing ? editor : display}
      </div>
    </div>
  )
}
