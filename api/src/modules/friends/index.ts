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
    detail: { tags: ["Friends"], description: "Enviar pedido de amizade" },
  })

  .get("/requests/pending", async ({ user }) => ({ requests: await friendService.getPendingRequests(user.id) }),
    { auth: true, detail: { tags: ["Friends"], description: "Listar pedidos recebidos" } })

  .get("/requests/sent", async ({ user }) => ({ requests: await friendService.getSentRequests(user.id) }),
    { auth: true, detail: { tags: ["Friends"], description: "Listar pedidos enviados" } })

  .post("/request/:id/accept", async ({ params, user }) => ({ friendship: await friendService.acceptFriendRequest(params.id, user.id) }),
    { auth: true, params: UUIDParamSchema, detail: { tags: ["Friends"], description: "Aceitar pedido" } })

  .post("/request/:id/reject", async ({ params, user }) => { await friendService.rejectFriendRequest(params.id, user.id); return { success: true } },
    { auth: true, params: UUIDParamSchema, detail: { tags: ["Friends"], description: "Recusar pedido" } })

  .delete("/request/:id", async ({ params, user }) => { await friendService.cancelFriendRequest(params.id, user.id); return { success: true } },
    { auth: true, params: UUIDParamSchema, detail: { tags: ["Friends"], description: "Cancelar pedido enviado" } })

  .get("/", async ({ user }) => ({ friends: await friendService.getFriends(user.id) }),
    { auth: true, detail: { tags: ["Friends"], description: "Listar amigos" } })

  .delete("/:id", async ({ params, user }) => { await friendService.removeFriend(user.id, params.id); return { success: true } },
    { auth: true, params: UUIDParamSchema, detail: { tags: ["Friends"], description: "Remover amizade" } })
