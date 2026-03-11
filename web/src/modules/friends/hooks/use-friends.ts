import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export const friendsKeys = {
  all: ["friends"] as const,
  list: () => [...friendsKeys.all, "list"] as const,
  pendingRequests: () => [...friendsKeys.all, "pending"] as const,
  sentRequests: () => [...friendsKeys.all, "sent"] as const,
}

export function useFriends() {
  return useQuery({
    queryKey: friendsKeys.list(),
    queryFn: async () => {
      const { data, error } = await api.friends.index.get()
      if (error) throw error
      return data.friends
    },
  })
}

export function usePendingRequests() {
  return useQuery({
    queryKey: friendsKeys.pendingRequests(),
    queryFn: async () => {
      const { data, error } = await api.friends.requests.pending.get()
      if (error) throw error
      return data.requests
    },
  })
}

export function useSentRequests() {
  return useQuery({
    queryKey: friendsKeys.sentRequests(),
    queryFn: async () => {
      const { data, error } = await api.friends.requests.sent.get()
      if (error) throw error
      return data.requests
    },
  })
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await api.friends.request.index.post({ username })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendsKeys.sentRequests() })
    },
    onError: (error: any) => {
      if (error?.status === 409 || error?.value?.code === "ALREADY_REQUESTED" || error?.value?.code === "ALREADY_FRIENDS") {
        queryClient.invalidateQueries({ queryKey: friendsKeys.sentRequests() })
        queryClient.invalidateQueries({ queryKey: friendsKeys.list() })
        queryClient.invalidateQueries({ queryKey: friendsKeys.pendingRequests() })
      }
    },
  })
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await api.friends.request({ id: requestId }).accept.post()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendsKeys.all })
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await api.friends.request({ id: requestId }).reject.post()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendsKeys.pendingRequests() })
    },
  })
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await api.friends.request({ id: requestId }).delete()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendsKeys.sentRequests() })
    },
  })
}

export function useRemoveFriend() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (friendId: string) => {
      const { data, error } = await api.friends({ id: friendId }).delete()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendsKeys.list() })
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })
}

