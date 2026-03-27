import { Elysia, t } from "elysia"
import * as conversationService from "@/modules/conversations/conversation.service"
import { authMacro } from "@/plugins/better-auth"
import { ConversationServiceError } from "@/shared/errors/conversation.errors"
import { UUIDParamSchema } from "@/shared/models/common.model"

export const conversationsRoutes = new Elysia({ prefix: "/conversations" })
  .use(authMacro)
  .onError(({ error, set }) => {
    if (error instanceof ConversationServiceError) {
      const statusMap: Record<ConversationServiceError["code"], number> = {
        NOT_PARTICIPANT: 403,
        BLOCKED_USER: 403,
        SELF_CONVERSATION: 400,
        NOT_FRIENDS: 403,
        USER_NOT_FOUND: 404,
        INTERNAL_ERROR: 500,
      }
      set.status = statusMap[error.code] ?? 400
      return { error: error.message, code: error.code }
    }
    throw error
  })
  .post(
    "/",
    async ({ user, body, set }) => {
      const conversation = await conversationService.createConversation(
        user.id,
        body.participantId
      )
      set.status = 201
      return conversation
    },
    {
      auth: true,
      body: t.Object({ participantId: t.String({ format: "uuid" }) }),
      detail: {
        tags: ["Conversations"],
        summary: "Criar nova conversa",
        description: "Cria uma nova conversa direta (DM) entre o usuário autenticado e outro usuário pelo ID. Se uma conversa entre os dois já existir, retorna a conversa existente. Os dois usuários precisam ser amigos para iniciar uma conversa.",
      },
    }
  )
  .get("/", async ({ user }) => {
    const conversations = await conversationService.getUserConversations(user.id)
    return { conversations }
  }, {
    auth: true,
    detail: {
      tags: ["Conversations"],
      summary: "Listar conversas",
      description: "Retorna todas as conversas do usuário autenticado, ordenadas pela última mensagem recebida. Inclui informações do participante e uma prévia da última mensagem de cada conversa.",
    },
  })
  .get(
    "/:id",
    async ({ user, params }) => {
      const isMember = await conversationService.isParticipant(user.id, params.id)
      if (!isMember) {
        throw new ConversationServiceError("You are not a participant of this conversation", "NOT_PARTICIPANT")
      }

      return await conversationService.getConversationById(params.id)
    },
    {
      auth: true,
      params: UUIDParamSchema,
      detail: {
        tags: ["Conversations"],
        summary: "Buscar conversa por ID",
        description: "Retorna os detalhes completos de uma conversa específica pelo seu ID. O usuário autenticado precisa ser participante da conversa para acessá-la, caso contrário retorna 403.",
      },
    }
  )
  .get(
    "/by-username/:username",
    async ({ user, params }) => conversationService.createConversationByUsername(user.id, params.username),
    {
      auth: true,
      params: t.Object({ username: t.String() }),
      detail: {
        tags: ["Conversations"],
        summary: "Buscar ou criar conversa por username",
        description: "Busca uma conversa existente com o usuário do username informado. Se não existir, cria uma nova conversa automaticamente. Útil para navegar diretamente ao chat de um usuário a partir do seu perfil.",
      },
    }
  )
