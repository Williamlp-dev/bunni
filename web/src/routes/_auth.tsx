import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/lib/auth'
import { queryClient } from '@/lib/query-client'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const session = await queryClient.fetchQuery(sessionQueryOptions)

    if (session?.user) {
      throw redirect({
        to: '/chat',
      })
    }
  },
  staleTime: Infinity,
  component: AuthLayout,
})

function AuthLayout() {
  return <Outlet />
}
