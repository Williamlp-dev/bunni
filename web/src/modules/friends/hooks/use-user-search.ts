import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export const userSearchKeys = {
  all: ["userSearch"] as const,
  search: (query: string) => [...userSearchKeys.all, query] as const,
}

export function useUserSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: userSearchKeys.search(query),
    queryFn: async () => {
      const { data, error } = await api.users.search.get({
        query: {
          q: query
        }
      })
      if (error) throw error
      return data
    },
    enabled: enabled && query.length >= 2,
    staleTime: 30 * 1000,
  })
}
