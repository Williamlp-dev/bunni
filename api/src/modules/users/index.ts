import { Elysia, t } from "elysia"
import * as userService from "./user.service"
import * as uploadService from "@/modules/uploads/upload.service"
import { UserServiceError } from "@/shared/errors/user.errors"
import { authMacro } from "@/plugins/better-auth"
import {
  UserSearchQuerySchema,
  UsernameParamSchema,
  UpdateBioBodySchema,
} from "./user.model"
import {
  UUIDParamSchema,
} from "@/shared/models/common.model"


export const usersRoutes = new Elysia({ prefix: "/users" })
  .use(authMacro)
  .onError(({ error, set }) => {
    if (error instanceof UserServiceError) {
      const statusMap: Record<UserServiceError["code"], number> = {
        SELF_BLOCK: 400,
        ALREADY_BLOCKED: 409,
        NOT_BLOCKED: 404,
        NOT_FOUND: 404,
      }
      set.status = statusMap[error.code]
      return { error: error.message, code: error.code }
    }
    throw error
  })
  .get("/search", async ({ query, user }) => ({ users: await userService.searchUsers(query.q, user.id, query.limit) }),
    {
      auth: true,
      query: UserSearchQuerySchema,
      detail: { tags: ["Users"], description: "Buscar usuários" },
    })

  .get("/blocked", async ({ user }) => ({ blocked: await userService.getBlockedUsers(user.id) }),
    {
      auth: true,
      detail: { tags: ["Users"], description: "Listar bloqueados" },
    })

  .get("/:username", async ({ params, set }) => {
    const foundUser = await userService.getUserByUsername(params.username)
    if (!foundUser) { set.status = 404; return { error: "Usuário não encontrado", code: "NOT_FOUND" } }
    return { user: foundUser }
  }, {
    auth: true,
    params: UsernameParamSchema,
    detail: { tags: ["Users"], description: "Buscar por username" },
  })

  .post("/:id/block", async ({ params, user }) => { await userService.blockUser(user.id, params.id); return { success: true } },
    {
      auth: true,
      params: UUIDParamSchema,
      detail: { tags: ["Users"], description: "Bloquear usuário" },
    })

  .delete("/:id/block", async ({ params, user }) => { await userService.unblockUser(user.id, params.id); return { success: true } },
    {
      auth: true,
      params: UUIDParamSchema,
      detail: { tags: ["Users"], description: "Desbloquear usuário" },
    })

  .post("/avatar/presigned-url", async ({ body, user }) => {
    return await uploadService.generateAvatarPresignedUrl(user.id, body.contentType)
  }, {
    auth: true,
    body: t.Object({
      contentType: t.Union([
        t.Literal("image/jpeg"),
        t.Literal("image/png"),
        t.Literal("image/webp"),
      ]),
    }),
    detail: { tags: ["Users"], description: "Gerar URL de upload para avatar" },
  })

  .patch("/avatar", async ({ body, user }) => {
    return await userService.updateAvatar(user.id, body.key)
  }, {
    auth: true,
    body: t.Object({ key: t.String({ minLength: 1 }) }),
    detail: { tags: ["Users"], description: "Atualizar avatar do usuário" },
  })

  .patch("/bio", async ({ body, user }) => {
    return await userService.updateBio(user.id, body.bio)
  }, {
    auth: true,
    body: UpdateBioBodySchema,
    detail: { tags: ["Users"], description: "Atualizar bio do usuário" },
  })
