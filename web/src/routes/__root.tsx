import { createRootRoute, Outlet } from "@tanstack/react-router"
import { NotFoundPage } from "@/components/ui/not-found"

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
})
