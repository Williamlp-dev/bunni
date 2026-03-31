import { Elysia, t } from "elysia"
import * as userService from "./user.service"
import * as uploadService from "@/modules/uploads/upload.service"
import { UserServiceError } from "@/shared/errors/user.errors"
import { authMacro } from "@/plugins/better-auth"
import {
  UserSearchQuerySchema,
  UpdateBioBodySchema,
  BlockStatusResponseSchema,
} from "./user.model"
import {
  UUIDParamSchema,
} from "@/shared/models/common.model"
import { t as T } from "elysia"


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
      detail: {
        tags: ["Users"],
        summary: "Buscar usuários",
        description: "Pesquisa usuários pelo nome ou username. Retorna uma lista paginada de usuários que correspondem ao termo buscado, excluindo o próprio usuário autenticado e usuários que ele bloqueou.",
      },
    })

  .get("/blocked", async ({ user }) => ({ blocked: await userService.getBlockedUsers(user.id) }),
    {
      auth: true,
      detail: {
        tags: ["Users"],
        summary: "Listar usuários bloqueados",
        description: "Retorna todos os usuários que o usuário autenticado bloqueou. Esses usuários não aparecem em buscas e não podem iniciar conversas.",
      },
    })

  .post("/:id/block", async ({ params, user }) => { await userService.blockUser(user.id, params.id); return { success: true } },
    {
      auth: true,
      params: UUIDParamSchema,
      detail: {
        tags: ["Users"],
        summary: "Bloquear usuário",
        description: "Bloqueia um usuário pelo seu ID.",
      },
    })

  .delete("/:id/block", async ({ params, user }) => { await userService.unblockUser(user.id, params.id); return { success: true } },
    {
      auth: true,
      params: UUIDParamSchema,
      detail: {
        tags: ["Users"],
        summary: "Desbloquear usuário",
        description: "Remove o bloqueio de um usuário previamente bloqueado.",
      },
    })

  .get("/:id/block-status", async ({ params, user }) => {
    if (params.id === user.id) return { isBlocked: false, isBlockedByMe: false, isBlockedByThem: false }
    const isBlockedByMe = await userService.isBlockedByMe(user.id, params.id)
    const isBlockedByThem = await userService.isBlockedByMe(params.id, user.id)
    return { isBlockedByMe, isBlockedByThem, isBlocked: isBlockedByMe || isBlockedByThem }
  }, {
    auth: true,
    params: UUIDParamSchema,
    response: BlockStatusResponseSchema,
    detail: {
      tags: ["Users"],
      summary: "Verificar status de bloqueio",
      description: "Verifica se o usuário autenticado bloqueou um usuário específico.",
    },
  })

  .get("/:id", async ({ params, set }) => {
    const foundUser = await userService.getUserByUsername(params.id)
    if (!foundUser) { set.status = 404; return { error: "Usuário não encontrado", code: "NOT_FOUND" } }
    return { user: foundUser }
  }, {
    auth: true,
    params: T.Object({ id: T.String({ minLength: 1 }) }),
    detail: {
      tags: ["Users"],
      summary: "Buscar perfil por username",
      description: "Retorna as informações públicas de um usuário a partir do seu username único.",
    },
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
    detail: {
      tags: ["Users"],
      summary: "Gerar URL de upload para avatar",
      description: "Gera uma URL pré-assinada temporária no Cloudflare R2 para upload direto do avatar do usuário. Suporta os formatos JPEG, PNG e WebP. Após o upload, use a rota PATCH /users/avatar para vincular a imagem ao perfil.",
    },
  })

  .patch("/avatar", async ({ body, user }) => {
    return await userService.updateAvatar(user.id, body.key)
  }, {
    auth: true,
    body: t.Object({ key: t.String({ minLength: 1 }) }),
    detail: {
      tags: ["Users"],
      summary: "Atualizar avatar",
      description: "Atualiza o avatar do usuário autenticado fornecendo a key do arquivo já enviado ao Cloudflare R2. Deve ser chamado após o upload via URL pré-assinada.",
    },
  })

  .patch("/bio", async ({ body, user }) => {
    return await userService.updateBio(user.id, body.bio)
  }, {
    auth: true,
    body: UpdateBioBodySchema,
    detail: {
      tags: ["Users"],
      summary: "Atualizar bio do perfil",
      description: "Atualiza a biografia (descrição pessoal) exibida no perfil do usuário autenticado. Aceita texto simples com limite de caracteres definido na validação.",
    },
  })
