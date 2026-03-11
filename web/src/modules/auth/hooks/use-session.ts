import { useQuery } from "@tanstack/react-query"
import { sessionQueryOptions } from "@/lib/auth"

export function useSession() {
  const { data, isPending, error, refetch } = useQuery(sessionQueryOptions)

  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    isPending,
    isAuthenticated: !!data?.user,
    error,
    refetch,
  }
}
