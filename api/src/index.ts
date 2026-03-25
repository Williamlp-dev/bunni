import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { betterAuthPlugin, OpenAPI } from "@/plugins/better-auth";
import { cors } from "@elysiajs/cors";
import { friendsRoutes } from "@/modules/friends";
import { usersRoutes } from "@/modules/users";
import { conversationsRoutes } from "@/modules/conversations";
import { messagesRoutes } from "@/modules/messages";
import { uploadsRoutes } from "@/modules/uploads";
import { wsPlugin } from "@/modules/websocket";
import { env } from "@/env";

const app = new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  )
  .use(openapi({
    path: '/docs',
    documentation: {
      components: await OpenAPI.components,
      paths: await OpenAPI.getPaths()
    }
  }))
  .use(betterAuthPlugin)
  .use(friendsRoutes)
  .use(usersRoutes)
  .use(conversationsRoutes)
  .use(messagesRoutes)
  .use(uploadsRoutes)
  .use(wsPlugin)
  .onRequest(({ request }) => {
    const method = request.method
    const url = new URL(request.url)
    console.log(`➡️  ${method} ${url.pathname}`)
  })
  .onAfterResponse(({ request, set }) => {
    const method = request.method
    const url = new URL(request.url)
    const status = set.status ?? 200
    console.log(`⬅️  ${method} ${url.pathname} ${status}`)
  })
  .get("/", () => "Hello Elysia")
  .listen(env.PORT);




console.log(`🐰 Buni is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`🐰 Buni docs at http://${app.server?.hostname}:${app.server?.port}/docs`);

export type App = typeof app;

