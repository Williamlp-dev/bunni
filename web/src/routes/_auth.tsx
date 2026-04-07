import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/lib/auth'
import { queryClient } from '@/lib/query-client'
import { SplashScreen } from '@/components/ui/splash-screen'
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
  pendingComponent: SplashScreen,
})

function AuthLayout() {
  return <Outlet />
}
