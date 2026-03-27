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
    provider: 'scalar',
    scalar: {
      theme: 'none',
      darkMode: true,
      layout: 'modern',
      customCss: `
        :root, .dark-mode, .light-mode {
          /* Cores de Texto */
          --scalar-color-1: #ffffff !important;
          --scalar-color-2: #cccccc !important;
          --scalar-color-3: #888888 !important;
          --scalar-color-accent: oklch(0.64 0.22 26) !important;
          
          /* Fundos Principais - Tudo preto absoluto */
          --scalar-background-1: #000000 !important;
          --scalar-background-2: #000000 !important;
          --scalar-background-3: #111111 !important;
          --scalar-background-accent: rgba(255, 255, 255, 0.1) !important;
          
          /* Sidebar (Barra Lateral) */
          --scalar-sidebar-background-1: #000000 !important;
          --scalar-sidebar-item-hover-background: #111111 !important;
          --scalar-sidebar-item-active-background: #222222 !important;
          --scalar-sidebar-color-1: #ffffff !important;
          --scalar-sidebar-color-2: #cccccc !important;
          
          /* Outros Elementos */
          --scalar-border-color: #222222 !important;
        }
      `
    },
    documentation: {
      info: {
        title: 'Buni API',
        version: '1.0.0',
        description: `
API oficial da Buni — aplicativo de mensagens em tempo real.

## Autenticação
A maioria das rotas requer autenticação via sessão gerenciada pelo **Better Auth**.
Certifique-se de estar autenticado antes de consumir os endpoints protegidos.

## Módulos
- **Auth** — Login, registro e gerenciamento de sessão
- **Users** — Perfil, busca, avatar, bio e bloqueio de usuários
- **Friends** — Envio, aceitação e gerenciamento de amizades
- **Conversations** — Criação e listagem de conversas diretas
- **Messages** — Envio, listagem e exclusão de mensagens
- **Uploads** — Geração de URLs pré-assinadas para arquivos de mídia
        `.trim(),
      },
      tags: [
        { name: 'Auth', description: 'Login, registro e gerenciamento de sessão com Better Auth' },
        { name: 'Users', description: 'Gerenciamento de perfil, busca de usuários, avatar, bio e bloqueios' },
        { name: 'Friends', description: 'Sistema de amizades — enviar, aceitar, recusar e remover conexões' },
        { name: 'Conversations', description: 'Criação e listagem de conversas diretas (DMs) entre usuários' },
        { name: 'Messages', description: 'Envio, listagem e exclusão de mensagens em tempo real via WebSocket' },
        { name: 'Uploads', description: 'Geração de URLs pré-assinadas no Cloudflare R2 para upload de mídia' },
      ],
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
  .get("/", () => "Hello Elysia", { detail: { hide: true } })
  .listen(env.PORT);




console.log(`🐰 Buni is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`🐰 Buni docs at http://${app.server?.hostname}:${app.server?.port}/docs`);

export type App = typeof app;

