import { createLazyFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Users, RefreshCw, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/ui/page-layout"
import { PageHeader } from "@/components/ui/page-header"
import {
  usePendingRequests,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  friendsKeys,
} from "@/modules/friends/hooks/use-friends"
import { FriendRequestCard } from "@/modules/friends/components/friend-request-card"
import { cn } from "@/lib/utils"

export const Route = createLazyFileRoute("/_layout/friends/requests")({
  component: FriendRequestsPage,
})

function FriendRequestsPage() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)

  useEffect(() => {
    const savedCooldown = localStorage.getItem("buni_requests_refresh")
    if (savedCooldown) {
      const remaining = Math.max(0, Math.ceil((parseInt(savedCooldown, 10) - Date.now()) / 1000))
      if (remaining > 0) {
        setCooldownTime(remaining)
      } else {
        localStorage.removeItem("buni_requests_refresh")
      }
    }
  }, [])

  useEffect(() => {
    if (cooldownTime <= 0) return
    const timer = setInterval(() => {
      setCooldownTime((prev) => {
        const next = prev - 1
        if (next <= 0) {
          localStorage.removeItem("buni_requests_refresh")
        }
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownTime])

  const { data: pendingRequestsData } = usePendingRequests()
  const acceptRequestMutation = useAcceptFriendRequest()
  const rejectRequestMutation = useRejectFriendRequest()
  const pendingRequests = pendingRequestsData ?? []

  const handleRefresh = async (): Promise<void> => {
    if (cooldownTime > 0) return
    setIsRefreshing(true)
    setCooldownTime(59)
    localStorage.setItem("buni_requests_refresh", (Date.now() + 59000).toString())
    await queryClient.invalidateQueries({ queryKey: friendsKeys.pendingRequests() })
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const handleAcceptRequest = (requestId: string): void => {
    acceptRequestMutation.mutate(requestId)
  }

  const handleRejectRequest = (requestId: string): void => {
    rejectRequestMutation.mutate(requestId)
  }

  return (
    <PageLayout>
      <PageHeader
        variant="inline"
        eyebrow="Networking"
        title="Pedidos Recebidos"
        description="Pessoas que querem se conectar com você."
        backTo="/chat"
      />

      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-lg bg-muted text-muted-foreground">
            <Inbox className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Caixa de Entrada
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingRequests.length === 0
                ? "Nenhum pedido pendente"
                : `${pendingRequests.length} pedido${pendingRequests.length !== 1 ? "s" : ""} aguardando`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cooldownTime > 0 && (
            <span className="text-xs font-medium text-muted-foreground animate-in fade-in slide-in-from-right-2">
              {cooldownTime}s
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing || cooldownTime > 0}
            className="size-9 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Atualizar pedidos"
          >
            <RefreshCw
              className={cn(
                "size-4 transition-all duration-500 ease-out",
                isRefreshing && "rotate-180 scale-90 opacity-50"
              )}
            />
          </Button>
        </div>
      </div>

      <div className="min-h-64">
        {pendingRequests.length > 0 ? (
          <div className="flex flex-col gap-2">
            {pendingRequests.map((request: (typeof pendingRequests)[number], i: number) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                index={i}
                onAccept={() => handleAcceptRequest(request.id)}
                onReject={() => handleRejectRequest(request.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-muted">
              <Users className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Tudo tranquilo por aqui
              </p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Você não tem nenhum pedido de amizade pendente.
              </p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
