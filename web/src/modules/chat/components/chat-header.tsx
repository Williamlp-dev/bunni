import { ChevronLeft, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader as PageHeaderUI } from "@/components/ui/page-header"

type ChatHeaderProps = {
  title: string
  onBack: () => void
}

export function ChatHeader({ title, onBack }: ChatHeaderProps) {
  return (
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
  )
}
