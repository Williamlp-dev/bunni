import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ActionButtonsProps = {
  onSave: () => void
  onCancel: () => void
  isLoading: boolean
  isDisabled?: boolean
  size?: "sm" | "md"
}

export function ActionButtons({ onSave, onCancel, isLoading, isDisabled, size = "md" }: ActionButtonsProps) {
  const btnSize = size === "sm" ? "size-8" : "size-9"

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onSave}
        disabled={isLoading || isDisabled}
        size="icon"
        className={cn(btnSize, "btn-press shrink-0 rounded-lg")}
      >
        {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      </Button>
      <Button
        onClick={onCancel}
        disabled={isLoading}
        variant="outline"
        size="icon"
        className={cn(btnSize, "btn-press shrink-0 rounded-lg")}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
