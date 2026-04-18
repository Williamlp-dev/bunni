import { Route } from "@/routes/_layout"
import type { User } from "@/modules/auth/types"

export function getUserInitials(name: string | null | undefined): string {
  if (!name || name.trim() === "" || name === "undefined") return "?"

  const parts = name.trim().split(/\s+/)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function useCurrentUser(): User {
  const { session } = Route.useRouteContext()
  return session.user as User
}
