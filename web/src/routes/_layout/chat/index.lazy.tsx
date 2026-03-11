import { createLazyFileRoute } from '@tanstack/react-router'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state"
import { MessageCircle } from "lucide-react"

export const Route = createLazyFileRoute('/_layout/chat/')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <div className="hidden md:flex flex-1 h-full">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <MessageCircle className="size-16 text-muted-foreground/50" />
          </EmptyMedia>
          <EmptyTitle>Suas mensagens</EmptyTitle>
          <EmptyDescription>Selecione uma conversa para enviar mensagens.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
