import { lazy, Suspense } from "react"
import { createLazyFileRoute } from "@tanstack/react-router"
import { useChatPage } from "@/modules/chat/hooks/use-chat-page"
import { ChatHeader } from "@/modules/chat/components/chat-header"
import { SelectionHeader } from "@/modules/chat/components/selection-header"
import { AsyncBoundary } from "@/components/async-boundary"
import { MessageList, MessageListSkeleton } from "@/modules/chat/components/message-list"
import { ChatInput } from "@/modules/chat/components/chat-input"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { UserX, Users, MessageCircle } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { UserProfileDrawer } from "@/modules/chat/components/user-profile-drawer"
import { useState } from "react"

const DeleteMessagesDialog = lazy(() => import("@/modules/chat/components/delete-messages-dialog").then(m => ({ default: m.DeleteMessagesDialog })))

export const Route = createLazyFileRoute("/_layout/chat/$username")({
  component: ChatWithUserRoute,
})

function ChatErrorFallback({ error, resetErrorBoundary }: any) {
  const navigate = useNavigate()
  const navigateToChat = () => navigate({ to: "/chat" })

  if (error?.code === "USER_NOT_FOUND") {
    return (
      <main className="flex flex-1 flex-col h-full bg-background overflow-hidden items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <UserX className="size-16 text-muted-foreground/50" />
            </EmptyMedia>
            <EmptyTitle>Usuário não encontrado</EmptyTitle>
            <EmptyDescription>O usuário buscado não existe.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={navigateToChat}>Voltar para conversas</Button>
          </EmptyContent>
        </Empty>
      </main>
    )
  }

  if (error?.code === "NOT_FRIENDS") {
    return (
      <main className="flex flex-1 flex-col h-full bg-background overflow-hidden items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <Users className="size-16 text-muted-foreground/50" />
            </EmptyMedia>
            <EmptyTitle>Vocês não são amigos</EmptyTitle>
            <EmptyDescription>Você precisa ser amigo dessa pessoa para iniciar uma conversa.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={navigateToChat}>Voltar para conversas</Button>
          </EmptyContent>
        </Empty>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col h-full bg-background overflow-hidden items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <MessageCircle className="size-16 text-muted-foreground/50" />
          </EmptyMedia>
          <EmptyTitle>Erro inesperado</EmptyTitle>
          <EmptyDescription>Ocorreu um erro ao carregar a conversa.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={navigateToChat}>Voltar para conversas</Button>
          <Button variant="outline" onClick={resetErrorBoundary}>Tentar novamente</Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}

function ChatSkeleton() {
  const navigate = useNavigate()
  return (
    <main className="flex flex-1 flex-col h-full bg-background overflow-hidden">
      <div className="relative">
        <ChatHeader title="..." onBack={() => navigate({ to: "/chat" })} onClearChat={() => {}} />
      </div>
      <div className="flex-1 overflow-hidden flex flex-col relative w-full pt-10">
        <MessageListSkeleton />
      </div>
      <div className="flex flex-col bg-background border-t border-border">
        <div className="flex items-center gap-4 px-6 py-2 h-20 opacity-50 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-muted/60 animate-pulse" />
            <div className="size-9 rounded-lg bg-muted/60 animate-pulse" />
          </div>
          <div className="relative flex-1">
            <div className="h-10 w-full rounded-md bg-muted/60 animate-pulse" />
          </div>
          <div className="relative flex items-center justify-center size-8 shrink-0">
            <div className="size-8 rounded-lg bg-muted/60 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  )
}

function ChatWithUserRoute() {
  return (
    <AsyncBoundary
      fallback={<ChatSkeleton />}
      errorFallback={(props: any) => <ChatErrorFallback {...props} />}
    >
      <ChatWithUserPage />
    </AsyncBoundary>
  )
}

function ChatWithUserPage() {
  const { username } = Route.useParams()
  const chat = useChatPage(username)

  const selectedCount = chat.selectedMessages.size
  const selectedMessageIds = new Set(chat.selectedMessages.keys())
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <>
      <main className="flex flex-1 flex-col h-full bg-background overflow-hidden">
        <div className="relative">
          <ChatHeader 
            title={chat.displayName}
            targetUserId={chat.targetUser?.id}
            isVerified={chat.targetUser?.isVerified}
            onBack={chat.navigateToChat} 
            onClearChat={chat.handleClearChat}
            onTitleClick={() => setIsProfileOpen(true)}
          />
          {selectedCount > 0 && (
            <SelectionHeader
              selectedCount={selectedCount}
              onDeselect={chat.clearSelection}
              onCopy={chat.handleCopySelected}
              onReply={chat.handleReplySelected}
              onDelete={chat.handleDeleteFromSelection}
            />
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col relative">
          <MessageList
            messages={chat.messages}
            activeConversationId={chat.conversationId}
            currentUserId={chat.currentUserId}
            activeParticipantName={chat.displayName}
            isTyping={chat.isTyping}
            onReply={chat.setReplyingTo}
            onDeleteRequest={chat.handleDeleteRequest}
            onEnterSelectionMode={chat.selectMessage}
            onToggleSelect={chat.toggleMessage}
            selectedMessageIds={selectedMessageIds}
            isSelectionMode={chat.isSelectionMode}
            hasNextPage={chat.hasNextPage}
            isFetchingNextPage={chat.isFetchingNextPage}
            onLoadMore={chat.handleLoadMore}
          />
        </div>

        {chat.isBlockedByMe ? (
          <div className="flex flex-col bg-background border-t border-border px-6 py-4 items-center justify-center h-20">
            <p className="text-sm text-muted-foreground text-center font-medium">
              Você bloqueou este usuário. Para enviar uma mensagem, desbloqueie-o primeiro.
            </p>
          </div>
        ) : chat.isBlockedByThem ? (
          <div className="flex flex-col bg-background border-t border-border px-6 py-4 items-center justify-center h-20">
            <p className="text-sm text-muted-foreground text-center font-medium">
              Você não pode enviar mensagens a este usuário.
            </p>
          </div>
        ) : (
          <ChatInput
            onSend={chat.handleSendMessage}
            onSendAudio={chat.handleSendAudioMessage}
            onSendImage={chat.handleSendImageMessage}
            onTyping={chat.handleTyping}
            disabled={!chat.conversationId}
            isSendingAudio={chat.isSendingAudio}
            replyingTo={chat.replyingTo}
            onCancelReply={() => chat.setReplyingTo(null)}
          />
        )}
      </main>

      {chat.targetUser && (
        <UserProfileDrawer
          open={isProfileOpen}
          onOpenChange={setIsProfileOpen}
          user={chat.targetUser}
          isBlocked={chat.isBlockedByMe}
        />
      )}

      <Suspense fallback={null}>
        <DeleteMessagesDialog
          open={chat.isDeleteDialogOpen}
          onOpenChange={chat.setIsDeleteDialogOpen}
          showDeleteForEveryone={chat.showDeleteForEveryone}
          selectedCount={chat.deleteTargetMessages.length}
          onDeleteForMe={chat.handleDeleteForMe}
          onDeleteForEveryone={chat.handleDeleteForEveryone}
        />
      </Suspense>
    </>
  )
}
