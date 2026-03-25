import { createAuthClient } from "better-auth/react"
import { usernameClient, inferAdditionalFields } from "better-auth/client/plugins"
import { queryOptions } from "@tanstack/react-query"
import type { auth as serverAuth } from "../../../api/src/auth"

export const auth = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL as string,
  basePath: "/auth",
  plugins: [
    usernameClient(),
    inferAdditionalFields<typeof serverAuth>(),
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
