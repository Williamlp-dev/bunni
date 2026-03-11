import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { SearchInput } from "@/components/ui/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty-state'
import { ConversationItem } from "./conversation-item"
import { useSuspenseConversations } from "../hooks/use-conversations"
import { getOtherParticipant, formatTimestamp } from "@/modules/chat/utils/chat-utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { AsyncBoundary } from "@/components/async-boundary"
import type { User } from "@/modules/auth/types"
import type { Conversation } from "@/lib/eden-types"

type ConversationSidebarProps = {
  user: User
  activeUsername?: string
}

function SidebarSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2 mx-2 opacity-50">
          <Skeleton className="size-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      ))}
    </>
  )
}

function ConversationList({
  searchQuery,
  user,
  activeUsername,
}: {
  searchQuery: string
  user: User
  activeUsername?: string
}) {
  const navigate = useNavigate()
  const { data: conversationsData } = useSuspenseConversations()

  const conversations = conversationsData?.conversations ?? []

  const filteredConversations = (conversations as Conversation[]).filter((c) => {
    const participant = getOtherParticipant(c, user.id)
    if (!participant) return false

    const query = searchQuery.toLowerCase()
    return (
      participant.name.toLowerCase().includes(query) ||
      (participant.displayUsername?.toLowerCase().includes(query) ?? false)
    )
  })

  if (filteredConversations.length === 0) {
    return (
      <div className="px-4 py-8">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nenhuma conversa</EmptyTitle>
            <EmptyDescription>Comece uma nova conversa</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <>
      {(filteredConversations as Conversation[]).map((conversation) => {
        const participant = getOtherParticipant(conversation, user.id)
        if (!participant) return null

        const rawUsername = participant.displayUsername || participant.username
        const username = rawUsername && rawUsername !== "undefined" ? rawUsername : participant.username

        return (
          <ConversationItem
            key={conversation.id}
            name={participant.name}
            lastMessage={conversation.lastMessage?.content}
            timestamp={formatTimestamp(conversation.updatedAt)}
            avatarSrc={participant.image ?? undefined}
            state={activeUsername === username ? "active" : "default"}
            onClick={() => {
              if (username) {
                navigate({ to: `/chat/$username`, params: { username } })
              }
            }}
          />
        )
      })}
    </>
  )
}

export function ConversationSidebar({ user, activeUsername }: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <aside className="w-full h-full flex flex-col bg-background md:border-r md:border-border overflow-hidden">
      <div className="p-4 border-b border-border/50 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground/90">
            Conversas
          </h2>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>

        <SearchInput
          placeholder="Buscar conversas..."
          value={searchQuery}
          onSearch={setSearchQuery}
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 pb-32 md:pb-2 scrollbar-hide">
        <AsyncBoundary
          fallback={<SidebarSkeleton />}
          errorFallback={
            <div className="px-4 py-8">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Erro</EmptyTitle>
                  <EmptyDescription>Falha ao carregar as conversas</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          }
        >
          <ConversationList
            searchQuery={searchQuery}
            user={user}
            activeUsername={activeUsername}
          />
        </AsyncBoundary>
      </div>
    </aside>
  )
}
