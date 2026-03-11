import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/chat/$username")({
  beforeLoad: ({ params }) => {
    if (!params.username || params.username === "undefined") {
      throw redirect({ to: "/chat" })
    }
  },
})
