import { and, asc, desc, eq, gt, inArray, isNull, aliasedTable } from "drizzle-orm"
import { db } from "@/database/client"
import { messages } from "@/database/schema/messages"
import { messageDeletions } from "@/database/schema/message-deletions"
import { users } from "@/database/schema/users"
import { encrypt, decrypt } from "@/lib/crypto"
import { isParticipant } from "@/modules/conversations/conversation.service"
import type { UserBasicInfo } from "@/modules/users/user.model"
import { MessageServiceError } from "@/shared/errors/message.errors"
import { deleteFromR2 } from "@/modules/uploads/upload.service"
import { env } from "@/env"



type MessageWithSender = {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: "text" | "audio" | "image"
  audioUrl: string | null
  audioDuration: number | null
  imageUrl: string | null
  createdAt: Date
  deletedAt: Date | null
  status: "sent" | "delivered" | "read"
  sender: UserBasicInfo
  replyTo?: {
    id: string
    content: string
    senderId: string
    sender: UserBasicInfo
    deletedAt: Date | null
    createdAt: Date
  }
}

type RawMessageRow = {
  id: string
  conversationId: string
  content: string
  type: "text" | "audio" | "image"
  audioUrl: string | null
  audioDuration: number | null
  imageUrl: string | null
  createdAt: Date
  senderId: string
  senderName: string | null
  senderRealUsername: string
  senderDisplayUsername: string
  senderImage: string | null
  deletedAt: Date | null
  status: "sent" | "delivered" | "read"
  replySnapshotContent: string | null
  replySnapshotSenderName: string | null
  replyToId: string | null
  replyToContent: string | null
  replyToSenderId: string | null
  replyToCreatedAt: Date | null
  replyToDeletedAt: Date | null
  replyToSenderName: string | null
  replyToSenderRealUsername: string | null
  replyToSenderDisplayUsername: string | null
  replyToSenderImage: string | null
  replyToType: "text" | "audio" | "image" | null
}

const repliedMessages = aliasedTable(messages, "replied_messages")
const repliedUsers = aliasedTable(users, "replied_users")

const MESSAGE_SELECT_FIELDS = {
  id: messages.id,
  conversationId: messages.conversationId,
  content: messages.content,
  type: messages.type,
  audioUrl: messages.audioUrl,
  audioDuration: messages.audioDuration,
  imageUrl: messages.imageUrl,
  createdAt: messages.createdAt,
  senderId: users.id,
  senderName: users.name,
  senderImage: users.image,
  deletedAt: messages.deletedAt,
  status: messages.status,
  senderRealUsername: users.username,
  senderDisplayUsername: users.displayUsername,
  replyToId: repliedMessages.id,
  replyToContent: repliedMessages.content,
  replyToSenderId: repliedUsers.id,
  replyToCreatedAt: repliedMessages.createdAt,
  replyToDeletedAt: repliedMessages.deletedAt,
  replyToSenderName: repliedUsers.name,
  replyToSenderDisplayUsername: repliedUsers.displayUsername,
  replyToSenderRealUsername: repliedUsers.username,
  replyToSenderImage: repliedUsers.image,
  replyToType: repliedMessages.type,
  replySnapshotContent: messages.replySnapshotContent,
  replySnapshotSenderName: messages.replySnapshotSenderName,
}

function mapToMessageWithSender(row: RawMessageRow): MessageWithSender {
  const isDeleted = !!row.deletedAt
  const isAudio = row.type === "audio"

  const message: MessageWithSender = {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: isDeleted
      ? "Mensagem apagada"
      : row.type === "audio"
        ? "🎤 Mensagem de voz"
        : row.type === "image"
          ? "📷 Imagem"
          : (!row.content ? "Mensagem apagada" : decrypt(row.content)),
    type: row.type,
    audioUrl: isDeleted ? null : row.audioUrl,
    audioDuration: row.audioDuration,
    imageUrl: isDeleted ? null : row.imageUrl,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
    status: row.status,
    sender: {
      id: row.senderId,
      name: row.senderName,
      displayUsername: row.senderDisplayUsername || row.senderRealUsername,
      username: row.senderRealUsername,
      image: row.senderImage,
    },
  }

  if (row.replyToId && row.replyToSenderId) {
    message.replyTo = {
      id: row.replyToId,
      content: row.replyToDeletedAt
        ? "Mensagem apagada"
        : row.replySnapshotContent
          ? decrypt(row.replySnapshotContent)
          : row.replyToType === "audio"
            ? "🎤 Mensagem de voz"
            : row.replyToType === "image"
              ? "📷 Imagem"
              : row.replyToContent
                ? decrypt(row.replyToContent)
                : "Mensagem apagada",
      senderId: row.replyToSenderId,
      deletedAt: row.replyToDeletedAt,
      createdAt: row.replyToCreatedAt || new Date(),
      sender: {
        id: row.replyToSenderId,
        // Prefer snapshot name if available for historical consistency
        name: row.replySnapshotSenderName ?? row.replyToSenderName,
        displayUsername: row.replyToSenderDisplayUsername ?? "",
        username: row.replyToSenderRealUsername ?? "",
        image: row.replyToSenderImage,
      },
    }
  }

  return message
}

export async function deleteMessage(
  userId: string,
  messageId: string
): Promise<MessageWithSender> {
  const message = await getMessageById(messageId)

  if (!message) {
    throw new MessageServiceError("Message not found", "NOT_FOUND")
  }

  if (message.senderId !== userId) {
    throw new MessageServiceError(
      "You can only delete your own messages",
      "UNAUTHORIZED_DELETE"
    )
  }

  const [updatedMessage] = await db
    .update(messages)
    .set({ deletedAt: new Date(), content: null })
    .where(eq(messages.id, messageId))
    .returning({ deletedAt: messages.deletedAt })

  return {
    ...message,
    deletedAt: updatedMessage.deletedAt,
    content: "Mensagem apagada",
  }
}

export async function deleteMessagesForMe(
  userId: string,
  messageIds: string[]
): Promise<{ deletedCount: number }> {
  if (messageIds.length > 50) {
    throw new MessageServiceError("Cannot delete more than 50 messages at once", "BATCH_LIMIT_EXCEEDED")
  }

  const values = messageIds.map((messageId) => ({
    messageId,
    userId,
  }))

  const result = await db
    .insert(messageDeletions)
    .values(values)
    .onConflictDoNothing({ target: [messageDeletions.messageId, messageDeletions.userId] })

  return { deletedCount: result.rowCount ?? 0 }
}

export async function undoDeleteForMe(
  userId: string,
  messageIds: string[]
): Promise<{ restoredCount: number }> {
  const result = await db
    .delete(messageDeletions)
    .where(
      and(
        eq(messageDeletions.userId, userId),
        inArray(messageDeletions.messageId, messageIds)
      )
    )

  return { restoredCount: result.rowCount ?? 0 }
}

export async function deleteMessagesForEveryone(
  userId: string,
  messageIds: string[]
): Promise<{ deletedCount: number; conversationId: string }> {
  if (messageIds.length > 50) {
    throw new MessageServiceError("Cannot delete more than 50 messages at once", "BATCH_LIMIT_EXCEEDED")
  }

  const targetMessages = await db
    .select({ id: messages.id, senderId: messages.senderId, conversationId: messages.conversationId })
    .from(messages)
    .where(inArray(messages.id, messageIds))

  if (targetMessages.length === 0) {
    throw new MessageServiceError("No messages found", "NOT_FOUND")
  }

  const unauthorizedMessage = targetMessages.find((m) => m.senderId !== userId)
  if (unauthorizedMessage) {
    throw new MessageServiceError(
      "You can only delete your own messages for everyone",
      "UNAUTHORIZED_DELETE"
    )
  }

  const conversationId = targetMessages[0].conversationId
  const foundIds = targetMessages.map((m) => m.id)

  const mediaMessages = await db
    .select({ audioUrl: messages.audioUrl, imageUrl: messages.imageUrl })
    .from(messages)
    .where(inArray(messages.id, foundIds))

  const r2Keys = mediaMessages.flatMap(({ audioUrl, imageUrl }) => {
    const keys: string[] = []
    const domain = env.R2_PUBLIC_DOMAIN
    for (const url of [audioUrl, imageUrl]) {
      if (url && url.startsWith(domain)) {
        keys.push(url.slice(domain.length + 1))
      }
    }
    return keys
  })

  await db
    .update(messages)
    .set({ deletedAt: new Date(), content: null })
    .where(inArray(messages.id, foundIds))

  await Promise.allSettled(r2Keys.map((key) => deleteFromR2(key)))

  return { deletedCount: foundIds.length, conversationId }
}

async function validateParticipation(
  userId: string,
  conversationId: string
): Promise<void> {
  const isMember = await isParticipant(userId, conversationId)
  if (!isMember) {
    throw new MessageServiceError(
      "You are not a participant of this conversation",
      "NOT_PARTICIPANT"
    )
  }
}


type SendMessageOptions = {
  id?: string
  type?: "text" | "audio" | "image"
  audioUrl?: string
  audioDuration?: number
  imageUrl?: string
}

export async function sendMessage(
  senderId: string,
  conversationId: string,
  content: string,
  replyToId?: string,
  options?: SendMessageOptions
): Promise<MessageWithSender> {
  await validateParticipation(senderId, conversationId)

  const messageType = options?.type ?? "text"

  if (messageType === "audio" && !options?.audioUrl) {
    throw new MessageServiceError("audioUrl is required for audio messages", "INVALID_REPLY")
  }

  let snapshotContent: string | null = null
  let snapshotSenderName: string | null = null

  if (replyToId) {
    const parentMessage = await db.query.messages.findFirst({
      where: and(
        eq(messages.id, replyToId),
        eq(messages.conversationId, conversationId)
      ),
      with: {
        sender: {
          columns: {
            name: true,
            displayUsername: true
          }
        }
      },
      columns: {
        id: true,
        content: true,
        type: true
      }
    })

    if (!parentMessage) {
      throw new MessageServiceError(
        "Message to reply not found or in different conversation",
        "INVALID_REPLY"
      )
    }

    const rawSnapshot = parentMessage.type === "audio"
      ? "🎤 Mensagem de voz"
      : parentMessage.type === "image"
        ? "📷 Imagem"
        : parentMessage.content
          ? decrypt(parentMessage.content)
          : null

    snapshotContent = rawSnapshot ? encrypt(rawSnapshot) : null
    snapshotSenderName = parentMessage.sender.name ?? parentMessage.sender.displayUsername
  }

  const encryptedContent = (messageType === "audio" || messageType === "image") ? null : encrypt(content)

  const [message] = await db
    .insert(messages)
    .values({
      id: options?.id,
      conversationId,
      senderId,
      content: encryptedContent,
      type: messageType,
      audioUrl: options?.audioUrl ?? null,
      audioDuration: options?.audioDuration ?? null,
      imageUrl: options?.imageUrl ?? null,
      replyToId,
      replySnapshotContent: snapshotContent,
      replySnapshotSenderName: snapshotSenderName,
    })
    .returning()

  return getMessageById(message.id) as Promise<MessageWithSender>
}

export async function getMessageById(
  messageId: string
): Promise<MessageWithSender | null> {
  const [result] = await db
    .select(MESSAGE_SELECT_FIELDS)
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .leftJoin(repliedMessages, eq(messages.replyToId, repliedMessages.id))
    .leftJoin(repliedUsers, eq(repliedMessages.senderId, repliedUsers.id))
    .where(eq(messages.id, messageId))
    .limit(1)

  return result ? mapToMessageWithSender(result) : null
}

export async function getPaginatedMessages(
  userId: string,
  conversationId: string,
  afterMessageId?: string,
  limit = 50
): Promise<{ messages: MessageWithSender[]; hasMore: boolean; nextCursor: string | null }> {
  await validateParticipation(userId, conversationId)

  const dbLimit = limit + 1
  const baseCondition = eq(messages.conversationId, conversationId)
  const afterCondition = await buildAfterCondition(afterMessageId)
  const notDeletedForMe = isNull(messageDeletions.id)

  const whereClause = afterCondition
    ? and(baseCondition, afterCondition, notDeletedForMe)
    : and(baseCondition, notDeletedForMe)

  const results = await db
    .select(MESSAGE_SELECT_FIELDS)
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .leftJoin(repliedMessages, eq(messages.replyToId, repliedMessages.id))
    .leftJoin(repliedUsers, eq(repliedMessages.senderId, repliedUsers.id))
    .leftJoin(
      messageDeletions,
      and(
        eq(messageDeletions.messageId, messages.id),
        eq(messageDeletions.userId, userId)
      )
    )
    .where(whereClause)
    .orderBy(afterMessageId ? asc(messages.createdAt) : desc(messages.createdAt))
    .limit(dbLimit)

  let finalResults = results.map(mapToMessageWithSender)

  const hasMore = finalResults.length > limit
  if (hasMore) {
    finalResults = finalResults.slice(0, limit)
  }

  if (!afterMessageId) {
    finalResults.reverse()
  }

  const nextCursor = hasMore && finalResults.length > 0
    ? finalResults[finalResults.length - 1].id
    : null

  return { messages: finalResults, hasMore, nextCursor }
}

async function buildAfterCondition(afterMessageId?: string) {
  if (!afterMessageId) return null

  const [afterMessage] = await db
    .select({ createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.id, afterMessageId))
    .limit(1)

  return afterMessage ? gt(messages.createdAt, afterMessage.createdAt) : null
}
