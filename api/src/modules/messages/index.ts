import { Elysia } from "elysia"
import { authMacro } from "@/plugins/better-auth"
import * as MessageService from "@/modules/messages/message.service"
import { MessageServiceError } from "@/shared/errors/message.errors"
import { broadcastToConversation } from "@/modules/websocket/connection-manager"
import {
  SendMessageBodySchema,
  BatchMessageIdsSchema,
} from "@/modules/messages/message.model"
import {
  ConversationIdParamSchema,
  MessageIdParamSchema,
  PaginationQuerySchema,
} from "@/shared/models/common.model"

export const messagesRoutes = new Elysia({ prefix: "/messages" })
  .use(authMacro)
  .onError(({ error, set }) => {
    if (error instanceof MessageServiceError) {
      const statusMap: Record<MessageServiceError["code"], number> = {
        NOT_PARTICIPANT: 403,
        NOT_FOUND: 404,
        UNAUTHORIZED_DELETE: 403,
        INTERNAL_ERROR: 500,
        INVALID_REPLY: 400,
        BATCH_LIMIT_EXCEEDED: 400,
        BLOCKED_USER: 403,
      }
      set.status = statusMap[error.code] ?? 400
      return { error: error.message, code: error.code }
    }
    throw error
  })
  .post(
    "/:conversationId",
    async ({ user, params, body, set }) => {
      const message = await MessageService.sendMessage(
        user.id,
        params.conversationId,
        body.content,
        body.replyToId,
        {
          id: body.id,
          type: body.type,
          audioUrl: body.audioUrl,
          audioDuration: body.audioDuration,
          imageUrl: body.imageUrl,
        }
      )

      await broadcastToConversation(
        params.conversationId,
        "message:new",
        {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          audioUrl: message.audioUrl,
          audioDuration: message.audioDuration,
          imageUrl: message.imageUrl,
          createdAt: message.createdAt.toISOString(),
          sender: message.sender,
          replyTo: message.replyTo,
        },
        undefined,
        undefined, // excludeUserId
        user.id // senderId
      )

      set.status = 201
      return message
    },
    {
      auth: true,
      params: ConversationIdParamSchema,
      body: SendMessageBodySchema,
      detail: {
        tags: ["Messages"],
        summary: "Enviar mensagem",
        description: "Envia uma nova mensagem em uma conversa. Suporta múltiplos tipos de conteúdo: texto, imagem e áudio. Após o envio, a mensagem é transmitida em tempo real a todos os participantes da conversa via WebSocket. Opcionalmente, pode ser uma resposta a outra mensagem informando o `replyToId`.",
      },
    }
  )
  .get(
    "/:conversationId",
    async ({ user, params, query }) => {
      return await MessageService.getPaginatedMessages(
        user.id,
        params.conversationId,
        query.after,
        query.limit ?? 50
      )
    },
    {
      auth: true,
      params: ConversationIdParamSchema,
      query: PaginationQuerySchema,
      detail: {
        tags: ["Messages"],
        summary: "Listar mensagens",
        description: "Retorna as mensagens de uma conversa com paginação baseada em cursor. Use o parâmetro `after` com o ID da última mensagem recebida para carregar mensagens mais antigas (scroll infinito). O parâmetro `limit` controla quantas mensagens são retornadas por vez (padrão: 50).",
      },
    }
  )
  .delete(
    "/:messageId",
    async ({ user, params }) => {
      const message = await MessageService.deleteMessage(user.id, params.messageId)

      await broadcastToConversation(
        message.conversationId, 
        "message:deleted", 
        {
          id: message.id,
          conversationId: message.conversationId,
        },
        undefined,
        undefined,
        user.id
      )

      return message
    },
    {
      auth: true,
      params: MessageIdParamSchema,
      detail: {
        tags: ["Messages"],
        summary: "Deletar mensagem para todos",
        description: "Deleta permanentemente uma mensagem pelo seu ID. Somente o autor da mensagem pode deletá-la. Após a exclusão, todos os participantes da conversa são notificados via WebSocket com o evento `message:deleted`.",
      },
    }
  )
  .post(
    "/delete-for-me",
    async ({ user, body }) => {
      return await MessageService.deleteMessagesForMe(user.id, body.messageIds)
    },
    {
      auth: true,
      body: BatchMessageIdsSchema,
      detail: {
        tags: ["Messages"],
        summary: "Apagar mensagens para mim",
        description: "Oculta uma ou mais mensagens apenas para o usuário autenticado, sem afetar a visualização dos outros participantes da conversa. As mensagens continuam existindo no banco de dados. Aceita um array de IDs para operação em lote.",
      },
    }
  )
  .post(
    "/undo-delete-for-me",
    async ({ user, body }) => {
      return await MessageService.undoDeleteForMe(user.id, body.messageIds)
    },
    {
      auth: true,
      body: BatchMessageIdsSchema,
      detail: {
        tags: ["Messages"],
        summary: "Desfazer apagar para mim",
        description: "Restaura a visibilidade de mensagens que foram apagadas apenas para o usuário autenticado. Aceita um array de IDs das mensagens que devem ser reexibidas.",
      },
    }
  )
  .post(
    "/delete-for-everyone",
    async ({ user, body }) => {
      const result = await MessageService.deleteMessagesForEveryone(user.id, body.messageIds)

      for (const messageId of body.messageIds) {
        await broadcastToConversation(
          result.conversationId, 
          "message:deleted", 
          {
            id: messageId,
            conversationId: result.conversationId,
          },
          undefined,
          undefined,
          user.id
        )
      }

      return { deletedCount: result.deletedCount }
    },
    {
      auth: true,
      body: BatchMessageIdsSchema,
      detail: {
        tags: ["Messages"],
        summary: "Apagar mensagens para todos",
        description: "Deleta permanentemente uma ou mais mensagens para todos os participantes da conversa. Somente o autor pode deletar suas próprias mensagens. Cada exclusão dispara o evento `message:deleted` via WebSocket. Aceita um array de IDs para exclusão em lote.",
      },
    }
  )
  .post(
    "/clear-conversation/:conversationId",
    async ({ user, params }) => {
      return await MessageService.clearConversationForMe(user.id, params.conversationId)
    },
    {
      auth: true,
      params: ConversationIdParamSchema,
      detail: {
        tags: ["Messages"],
        summary: "Limpar conversa",
        description: "Remove todas as mensagens de uma conversa apenas para o usuário autenticado. A conversa permanece na lista e o outro participante não é afetado. Ideal para liberar o histórico sem apagar para todos.",
      },
    }
  )
