import { createAuthClient } from "better-auth/react"
import { usernameClient } from "better-auth/client/plugins"
import { queryOptions } from "@tanstack/react-query"

export const auth = createAuthClient({
  baseURL: "http://localhost:3333",
  basePath: "/auth",
  plugins: [
    usernameClient()
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
})

export const sessionQueryOptions = queryOptions({
  queryKey: ["auth-session"],
  queryFn: async () => {
    const res = await auth.getSession()
    return res.data
  },
  staleTime: Infinity,
})
