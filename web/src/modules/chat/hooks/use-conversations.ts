import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export const conversationsKeys = {
  all: ["conversations"] as const,
  list: () => [...conversationsKeys.all, "list"] as const,
  byUsername: (username: string) => [...conversationsKeys.all, "byUsername", username] as const,
}

export function useConversations() {
  return useQuery({
    queryKey: conversationsKeys.list(),
    queryFn: async () => {
      const { data, error } = await api.conversations.index.get()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

import { useSuspenseQuery } from "@tanstack/react-query"

export function useSuspenseConversations() {
  return useSuspenseQuery({
    queryKey: conversationsKeys.list(),
    queryFn: async () => {
      const { data, error } = await api.conversations.index.get()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useConversationByUsername(username: string) {
  return useQuery({
    queryKey: conversationsKeys.byUsername(username),
    queryFn: async () => {
      const { data, error } = await api.conversations['by-username']({ username }).get()
      if (error) throw error
      return data
    },
    enabled: !!username,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSuspenseConversationByUsername(username: string) {
  return useSuspenseQuery({
    queryKey: conversationsKeys.byUsername(username),
    queryFn: async () => {
      const { data, error } = await api.conversations['by-username']({ username }).get()
      if (error) throw error.value
      return data
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}
