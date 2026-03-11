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
          type: body.type,
          audioUrl: body.audioUrl,
          audioDuration: body.audioDuration,
          imageUrl: body.imageUrl,
        }
      )

      broadcastToConversation(
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
        user.id
      )

      set.status = 201
      return message
    },
    {
      auth: true,
      params: ConversationIdParamSchema,
      body: SendMessageBodySchema,
      detail: { tags: ["Messages"], description: "Enviar mensagem" },
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
      detail: { tags: ["Messages"], description: "Listar mensagens" },
    }
  )
  .delete(
    "/:messageId",
    async ({ user, params }) => {
      const message = await MessageService.deleteMessage(user.id, params.messageId)

      broadcastToConversation(message.conversationId, "message:deleted", {
        id: message.id,
        conversationId: message.conversationId,
      })

      return message
    },
    {
      auth: true,
      params: MessageIdParamSchema,
      detail: { tags: ["Messages"], description: "Deletar mensagem" },
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
      detail: { tags: ["Messages"], description: "Apagar mensagens para mim" },
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
      detail: { tags: ["Messages"], description: "Desfazer apagar para mim" },
    }
  )
  .post(
    "/delete-for-everyone",
    async ({ user, body }) => {
      const result = await MessageService.deleteMessagesForEveryone(user.id, body.messageIds)

      for (const messageId of body.messageIds) {
        broadcastToConversation(result.conversationId, "message:deleted", {
          id: messageId,
          conversationId: result.conversationId,
        })
      }

      return { deletedCount: result.deletedCount }
    },
    {
      auth: true,
      body: BatchMessageIdsSchema,
      detail: { tags: ["Messages"], description: "Apagar mensagens para todos" },
    }
  )
