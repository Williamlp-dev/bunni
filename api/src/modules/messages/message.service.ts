import { and, asc, desc, eq, gt, inArray, isNull, ne, aliasedTable } from "drizzle-orm"
import { db } from "@/database/client"
import { messages } from "@/database/schema/messages"
import { conversations, conversationParticipants } from "@/database/schema/conversations"
import { messageDeletions } from "@/database/schema/message-deletions"
import { users } from "@/database/schema/users"
import { encrypt, decrypt } from "@/lib/crypto"
import { isParticipant, getOtherParticipantIds } from "@/modules/conversations/conversation.service"
import type { UserBasicInfo } from "@/modules/users/user.model"
import { MessageServiceError } from "@/shared/errors/message.errors"
import { isBlocked } from "@/shared/helpers/relationship.helpers"
import { deleteFromR2 } from "@/modules/uploads/upload.service"
import { env } from "@/env"
import { isUserOnline, isUserSubscribedToConversation, sendToUser } from "@/modules/websocket/connection-manager"



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

function resolveMessageContent(row: RawMessageRow): string {
  if (row.deletedAt) return "Mensagem apagada"
  if (row.type === "audio") return "🎤 Mensagem de voz"
  if (row.type === "image") return "📷 Imagem"
  return row.content ? decrypt(row.content) : "Mensagem apagada"
}

function resolveReplyContent(row: RawMessageRow): string {
  if (row.replyToDeletedAt) return "Mensagem apagada"
  if (row.replySnapshotContent) return decrypt(row.replySnapshotContent)
  if (row.replyToType === "audio") return "🎤 Mensagem de voz"
  if (row.replyToType === "image") return "📷 Imagem"
  return row.replyToContent ? decrypt(row.replyToContent) : "Mensagem apagada"
}

function mapToMessageWithSender(row: RawMessageRow): MessageWithSender {
  const message: MessageWithSender = {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: resolveMessageContent(row),
    type: row.type,
    audioUrl: row.deletedAt ? null : row.audioUrl,
    audioDuration: row.audioDuration,
    imageUrl: row.deletedAt ? null : row.imageUrl,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
    status: row.status,
    sender: {
      id: row.senderId,
      name: row.senderName,
      displayUsername: row.senderDisplayUsername || row.senderRealUsername,
      username: row.senderRealUsername,
      image: row.senderImage,
      bio: null,
    },
  }

  if (row.replyToId && row.replyToSenderId) {
    message.replyTo = {
      id: row.replyToId,
      content: resolveReplyContent(row),
      senderId: row.replyToSenderId,
      deletedAt: row.replyToDeletedAt,
      createdAt: row.replyToCreatedAt || new Date(),
      sender: {
        id: row.replyToSenderId,
        name: row.replySnapshotSenderName ?? row.replyToSenderName,
        displayUsername: row.replyToSenderDisplayUsername ?? "",
        username: row.replyToSenderRealUsername ?? "",
        image: row.replyToSenderImage,
        bio: null,
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

export async function clearConversationForMe(
  userId: string,
  conversationId: string
): Promise<{ clearedCount: number }> {
  await validateParticipation(userId, conversationId)

  const allMessageIds = await db
    .select({ id: messages.id })
    .from(messages)
    .leftJoin(
      messageDeletions,
      and(
        eq(messageDeletions.messageId, messages.id),
        eq(messageDeletions.userId, userId)
      )
    )
    .where(
      and(
        eq(messages.conversationId, conversationId),
        isNull(messageDeletions.id)
      )
    )

  if (allMessageIds.length === 0) {
    return { clearedCount: 0 }
  }

  const values = allMessageIds.map(({ id }) => ({
    messageId: id,
    userId,
  }))

  const result = await db
    .insert(messageDeletions)
    .values(values)
    .onConflictDoNothing({ target: [messageDeletions.messageId, messageDeletions.userId] })

  return { clearedCount: result.rowCount ?? 0 }
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
    .select({
      id: messages.id,
      senderId: messages.senderId,
      conversationId: messages.conversationId,
      audioUrl: messages.audioUrl,
      imageUrl: messages.imageUrl,
    })
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

  const r2Keys = targetMessages.flatMap(({ audioUrl, imageUrl }) => {
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

  const otherParticipants = await getOtherParticipantIds(senderId, conversationId)
  for (const participantId of otherParticipants) {
    if (await isBlocked(senderId, participantId)) {
      throw new MessageServiceError("Cannot send message to blocked user", "BLOCKED_USER")
    }
  }

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

  const finalContent = messageType === "audio" ? "Mensagem de voz" : messageType === "image" ? "Imagem" : content
  const encryptedContent = encrypt(finalContent)

  const recipientId = otherParticipants[0]
  const isRecipientOnline = recipientId ? isUserOnline(recipientId) : false
  const isRecipientInChat = recipientId
    ? isUserSubscribedToConversation(recipientId, conversationId)
    : false

  const messageStatus: "sent" | "delivered" | "read" = isRecipientInChat
    ? "read"
    : isRecipientOnline
      ? "delivered"
      : "sent"

  const messageValues = {
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
    status: messageStatus,
  }

  const [message] = await db
    .insert(messages)
    .values(messageValues)
    .onConflictDoUpdate({
      target: messages.id,
      set: { id: messages.id },
    })
    .returning()

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId))

  if (isRecipientInChat) {
    sendToUser(senderId, "message:read", { conversationId, readBy: recipientId! })
  } else if (isRecipientOnline) {
    sendToUser(senderId, "message:delivered", { conversationId })
  }

  return getMessageById(message.id) as Promise<MessageWithSender>
}

export async function markPendingAsDelivered(userId: string): Promise<void> {
  const updated = await db
    .update(messages)
    .set({ status: "delivered" })
    .where(
      and(
        ne(messages.senderId, userId),
        eq(messages.status, "sent")
      )
    )
    .returning({
      conversationId: messages.conversationId,
      senderId: messages.senderId,
    })

  const perSenderConversations = new Map<string, Set<string>>()
  for (const row of updated) {
    const convSet = perSenderConversations.get(row.senderId) ?? new Set<string>()
    convSet.add(row.conversationId)
    perSenderConversations.set(row.senderId, convSet)
  }

  for (const [senderId, conversationIds] of perSenderConversations) {
    for (const conversationId of conversationIds) {
      sendToUser(senderId, "message:delivered", { conversationId })
    }
  }
}

export async function markConversationAsRead(
  userId: string,
  conversationId: string
): Promise<void> {
  const [latestMessage] = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(1)

  const updated = await db
    .update(messages)
    .set({ status: "read" })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, userId),
        ne(messages.status, "read")
      )
    )
    .returning({ senderId: messages.senderId })

  if (latestMessage) {
    await db
      .update(conversationParticipants)
      .set({ lastReadMessageId: latestMessage.id })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      )
  }

  const uniqueSenderIds = [...new Set(updated.map((r) => r.senderId))]
  for (const senderId of uniqueSenderIds) {
    sendToUser(senderId, "message:read", { conversationId, readBy: userId })
  }
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
