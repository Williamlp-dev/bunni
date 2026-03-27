import { Elysia } from "elysia"
import * as friendService from "./friend.service"
import { getUserByUsername } from "@/modules/users/user.service"
import { FriendServiceError } from "@/shared/errors/friend.errors"
import { authMacro } from "@/plugins/better-auth"
import {
  UsernameBodySchema,
} from "./friend.model"
import {
  UUIDParamSchema,
} from "@/shared/models/common.model"

export const friendsRoutes = new Elysia({ prefix: "/friends" })
  .use(authMacro)
  .onError(({ error, set }) => {
    if (error instanceof FriendServiceError) {
      const statusMap: Record<FriendServiceError["code"], number> = {
        SELF_REQUEST: 400,
        ALREADY_FRIENDS: 409,
        ALREADY_REQUESTED: 409,
        BLOCKED: 403,
        NOT_FOUND: 404,
        UNAUTHORIZED: 403,
      }
      set.status = statusMap[error.code]
      return { error: error.message, code: error.code }
    }
    throw error
  })
  .post("/request", async ({ body, user }) => {
    const receiver = await getUserByUsername(body.username)
    if (!receiver) return { error: "Usuário não encontrado", code: "NOT_FOUND" }

    const request = await friendService.sendFriendRequest(user.id, receiver.id)
    return { id: request.id, receiver: { id: receiver.id, name: receiver.name, username: receiver.username, image: receiver.image }, createdAt: request.createdAt }
  }, {
    auth: true,
    body: UsernameBodySchema,
    detail: {
      tags: ["Friends"],
      summary: "Enviar pedido de amizade",
      description: "Envia um pedido de amizade para outro usuário a partir do seu username. O pedido ficará pendente até ser aceito ou recusado pelo destinatário. Retorna um erro se o usuário já for amigo, se já existe um pedido pendente ou se o usuário está bloqueado.",
    },
  })

  .get("/requests/pending", async ({ user }) => ({ requests: await friendService.getPendingRequests(user.id) }),
    {
      auth: true,
      detail: {
        tags: ["Friends"],
        summary: "Listar pedidos recebidos",
        description: "Retorna todos os pedidos de amizade pendentes que o usuário autenticado recebeu e ainda não respondeu. Útil para exibir notificações e a tela de pedidos.",
      },
    })

  .get("/requests/sent", async ({ user }) => ({ requests: await friendService.getSentRequests(user.id) }),
    {
      auth: true,
      detail: {
        tags: ["Friends"],
        summary: "Listar pedidos enviados",
        description: "Retorna todos os pedidos de amizade enviados pelo usuário autenticado que ainda estão aguardando resposta. Permite que o usuário veja e cancele pedidos em aberto.",
      },
    })

  .post("/request/:id/accept", async ({ params, user }) => ({ friendship: await friendService.acceptFriendRequest(params.id, user.id) }),
    {
      auth: true,
      params: UUIDParamSchema,
      detail: {
        tags: ["Friends"],
        summary: "Aceitar pedido de amizade",
        description: "Aceita um pedido de amizade recebido pelo seu ID. Após aceitar, os dois usuários se tornam amigos e podem iniciar conversas entre si.",
      },
    })

  .post("/request/:id/reject", async ({ params, user }) => { await friendService.rejectFriendRequest(params.id, user.id); return { success: true } },
    {
      auth: true,
      params: UUIDParamSchema,
      detail: {
        tags: ["Friends"],
        summary: "Recusar pedido de amizade",
        description: "Recusa um pedido de amizade recebido. O pedido é removido e o remetente poderá enviar um novo pedido no futuro.",
      },
    })

  .delete("/request/:id", async ({ params, user }) => { await friendService.cancelFriendRequest(params.id, user.id); return { success: true } },
    {
      auth: true,
      params: UUIDParamSchema,
      detail: {
        tags: ["Friends"],
        summary: "Cancelar pedido enviado",
        description: "Cancela e remove um pedido de amizade enviado pelo usuário autenticado que ainda não foi respondido. Somente o remetente original pode cancelar o pedido.",
      },
    })

  .get("/", async ({ user }) => ({ friends: await friendService.getFriends(user.id) }),
    {
      auth: true,
      detail: {
        tags: ["Friends"],
        summary: "Listar amigos",
        description: "Retorna a lista completa de amigos do usuário autenticado, incluindo informações de perfil de cada amigo como nome, username e avatar.",
      },
    })

  .delete("/:id", async ({ params, user }) => { await friendService.removeFriend(user.id, params.id); return { success: true } },
    {
      auth: true,
      params: UUIDParamSchema,
      detail: {
        tags: ["Friends"],
        summary: "Remover amigo",
        description: "Remove a amizade entre o usuário autenticado e outro usuário pelo ID. Ambos os usuários perdem a conexão de amizade. As mensagens trocadas anteriormente não são afetadas.",
      },
    })
