import { createLazyFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { UserPlus, Search } from "lucide-react"
import { SearchInput } from "@/components/ui/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import { PageLayout } from "@/components/ui/page-layout"
import { PageHeader } from "@/components/ui/page-header"
import {
  useFriends,
  useSentRequests,
  useSendFriendRequest,
} from "@/modules/friends/hooks/use-friends"
import { useUserSearch } from "@/modules/friends/hooks/use-user-search"
import type { Friend, Request, UserSearchInfo } from "@/lib/eden-types"
import { UserSearchResultItem } from "@/modules/friends/components/user-search-result-item"

export const Route = createLazyFileRoute("/_layout/friends/")({
  component: AddFriendsPage,
})

function AddFriendsPage() {
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(userSearchQuery, 500)

  const { data: friendsData } = useFriends()
  const { data: sentRequestsData } = useSentRequests()
  const { data: userSearchData, isLoading: isSearching } = useUserSearch(debouncedSearchQuery)
  const sendFriendRequestMutation = useSendFriendRequest()

  const friends = friendsData ?? []
  const sentRequests = sentRequestsData ?? []
  const searchResults = userSearchData?.users ?? []
  const filteredSearchResults = (searchResults as UserSearchInfo[]).filter(
    (u) => !friends.some((f: Friend) => f.id === u.id)
  )

  const friendIdsSet = new Set(friends.map((f: Friend) => f.id))
  const sentRequestIdsSet = new Set(
    sentRequests.map((r: Request) => r.receiver?.id).filter(Boolean)
  )

  const getUserStatus = (userId: string): "none" | "pending" | "friend" => {
    if (friendIdsSet.has(userId)) return "friend"
    if (sentRequestIdsSet.has(userId)) return "pending"
    return "none"
  }

  const handleAddFriend = (username: string): void => {
    sendFriendRequestMutation.mutate(username)
  }

  const hasQuery = userSearchQuery.length >= 2
  const isDebouncing = userSearchQuery !== debouncedSearchQuery
  const showSkeleton = isSearching || isDebouncing

  return (
    <PageLayout>
      <PageHeader
        variant="inline"
        eyebrow="Nova Conexão"
        title="Adicionar Amigos"
        description="Encontre pessoas pelo username e expanda sua rede."
        backTo="/chat"
      />

      <SearchInput
        placeholder="Digite @username..."
        value={userSearchQuery}
        onSearch={setUserSearchQuery}
        className="w-full h-11 rounded-lg bg-card border-border"
      />

      <div className="min-h-64">
        {!hasQuery ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-muted">
              <UserPlus className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Pronto para explorar?
              </p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Digite pelo menos 2 caracteres para começar.
              </p>
            </div>
          </div>
        ) : showSkeleton ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredSearchResults.length > 0 ? (
          <div className="flex flex-col gap-2">
            {(filteredSearchResults as UserSearchInfo[]).map((user, i) => (
              <UserSearchResultItem
                key={user.id}
                user={user}
                index={i}
                status={getUserStatus(user.id)}
                onAdd={() => handleAddFriend(user.displayUsername)}
                isLoading={sendFriendRequestMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-muted">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Nenhum resultado
              </p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Não encontramos ninguém com o username "{userSearchQuery}"
              </p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
