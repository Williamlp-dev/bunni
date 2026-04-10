import { and, eq, sql, inArray, gt, ne } from "drizzle-orm"
import { db } from "@/database/client"
import {
  conversations,
  conversationParticipants,
} from "@/database/schema/conversations"
import { messages } from "@/database/schema/messages"
import { users } from "@/database/schema/users"
import { getUserByUsername } from "@/modules/users/user.service"
import { areFriends, isBlocked } from "@/shared/helpers/relationship.helpers"
import { ConversationServiceError } from "@/shared/errors/conversation.errors"
import { decrypt } from "@/lib/crypto"
import type { UserBasicInfo } from "@/modules/users/user.model"
import type { LastMessage } from "@/modules/conversations/conversation.model"

type ConversationWithParticipants = {
  id: string
  createdAt: Date
  updatedAt: Date
  participants: UserBasicInfo[]
  lastMessage: LastMessage | null
  unreadCount: number
}

export async function createConversation(
  creatorId: string,
  participantId: string
): Promise<ConversationWithParticipants> {
  validateNotSelf(creatorId, participantId)

  const existing = await findExistingConversation(creatorId, participantId)
  if (existing) return existing

  await validateNotBlocked(creatorId, participantId)
  await validateFriendship(creatorId, participantId)

  return createNewConversation(creatorId, participantId)
}

export async function createConversationByUsername(
  creatorId: string,
  username: string
): Promise<ConversationWithParticipants> {
  const targetUser = await getUserByUsername(username)
  if (!targetUser) {
    throw new ConversationServiceError("User not found", "USER_NOT_FOUND")
  }

  return createConversation(creatorId, targetUser.id)
}

function validateNotSelf(creatorId: string, participantId: string): void {
  if (creatorId === participantId) {
    throw new ConversationServiceError(
      "Cannot create conversation with yourself",
      "SELF_CONVERSATION"
    )
  }
}

async function validateNotBlocked(
  userOneId: string,
  userTwoId: string
): Promise<void> {
  const blocked = await isBlocked(userOneId, userTwoId)
  if (blocked) {
    throw new ConversationServiceError(
      "Cannot create conversation with blocked user",
      "BLOCKED_USER"
    )
  }
}

async function validateFriendship(
  userOneId: string,
  userTwoId: string
): Promise<void> {
  const friendshipExists = await areFriends(userOneId, userTwoId)
  if (!friendshipExists) {
    throw new ConversationServiceError(
      "Users must be friends to start a conversation",
      "NOT_FRIENDS"
    )
  }
}

async function createNewConversation(
  creatorId: string,
  participantId: string
): Promise<ConversationWithParticipants> {
  return await db.transaction(async (tx) => {
    const [conversation] = await tx
      .insert(conversations)
      .values({})
      .returning()

    await tx.insert(conversationParticipants).values([
      { conversationId: conversation.id, userId: creatorId },
      { conversationId: conversation.id, userId: participantId },
    ])

    const participantUsers = await tx
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        username: users.username,
        displayUsername: users.displayUsername,
        bio: users.bio,
      })
      .from(users)
      .where(inArray(users.id, [creatorId, participantId]))

    if (participantUsers.length !== 2) {
      throw new ConversationServiceError("User not found during creation", "INTERNAL_ERROR")
    }

    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: participantUsers.map(u => ({
        ...u,
        displayUsername: u.displayUsername || u.username,
        bio: u.bio,
      })),
      lastMessage: null,
      unreadCount: 0,
    }
  })
}

export async function findExistingConversation(
  userOneId: string,
  userTwoId: string
): Promise<ConversationWithParticipants | null> {
  const result = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(inArray(conversationParticipants.userId, [userOneId, userTwoId]))
    .groupBy(conversationParticipants.conversationId)
    .having(sql`COUNT(DISTINCT ${conversationParticipants.userId}) = 2`)
    .limit(1)

  if (result.length === 0) return null

  return getConversationById(result[0].conversationId)
}

export async function getConversationById(
  conversationId: string
): Promise<ConversationWithParticipants | null> {
  const conversation = await db
    .select({
      id: conversations.id,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)

  if (conversation.length === 0) return null

  const participants = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      displayUsername: users.displayUsername,
      image: users.image,
      bio: users.bio,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(conversationParticipants.userId, users.id))
    .where(eq(conversationParticipants.conversationId, conversationId))

  return {
    id: conversation[0].id,
    createdAt: conversation[0].createdAt,
    updatedAt: conversation[0].updatedAt,
    participants: participants.map(p => ({
      ...p,
      displayUsername: p.displayUsername || p.username,
      bio: p.bio,
    })),
    lastMessage: null,
    unreadCount: 0,
  }
}

export async function getUserConversations(
  userId: string
): Promise<ConversationWithParticipants[]> {
  const userConversationIds = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      lastReadMessageId: conversationParticipants.lastReadMessageId,
    })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId))

  if (userConversationIds.length === 0) return []

  const conversationIds = userConversationIds.map(c => c.conversationId)

  const lastReadByConversation = new Map<string, string | null>()
  for (const row of userConversationIds) {
    lastReadByConversation.set(row.conversationId, row.lastReadMessageId ?? null)
  }

  const [conversationsData, allParticipants, lastMessages] = await Promise.all([
    db
      .select({
        id: conversations.id,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(inArray(conversations.id, conversationIds))
      .orderBy(sql`${conversations.updatedAt} DESC`),

    db
      .select({
        conversationId: conversationParticipants.conversationId,
        id: users.id,
        name: users.name,
        username: users.username,
        displayUsername: users.displayUsername,
        image: users.image,
        bio: users.bio,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(inArray(conversationParticipants.conversationId, conversationIds)),

    db.execute<{
      conversationId: string
      id: string
      content: string | null
      type: string
      senderId: string
      createdAt: Date
      deletedAt: Date | null
    }>(sql`
      SELECT DISTINCT ON (conversation_id)
        conversation_id AS "conversationId",
        id,
        content,
        type,
        sender_id AS "senderId",
        created_at AS "createdAt",
        deleted_at AS "deletedAt"
      FROM messages
      WHERE conversation_id = ANY(ARRAY[${sql.join(conversationIds.map(id => sql`${id}`), sql`, `)}]::text[])
      ORDER BY conversation_id, created_at DESC
    `),
  ])

  const participantsByConversation = new Map<string, typeof allParticipants>()
  for (const participant of allParticipants) {
    const existing = participantsByConversation.get(participant.conversationId) || []
    participantsByConversation.set(participant.conversationId, [...existing, participant])
  }

  const lastMessageRows = lastMessages.rows
  const lastMessageByConversation = new Map<string, typeof lastMessageRows[0]>()
  for (const msg of lastMessageRows) {
    lastMessageByConversation.set(msg.conversationId, msg)
  }

  const unreadCountPromises = conversationIds.map(async (convId) => {
    const lastReadId = lastReadByConversation.get(convId) ?? null

    const [row] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, convId),
          lastReadId
            ? gt(messages.createdAt, sql`(SELECT created_at FROM messages WHERE id = ${lastReadId})`)
            : undefined,
          sql`${messages.senderId} != ${userId}`
        )
      )

    return { convId, count: row?.count ?? 0 }
  })

  const unreadCounts = await Promise.all(unreadCountPromises)
  const unreadCountByConversation = new Map<string, number>()
  for (const { convId, count } of unreadCounts) {
    unreadCountByConversation.set(convId, count)
  }

  return conversationsData.map(conv => {
    const rawLastMsg = lastMessageByConversation.get(conv.id) ?? null
    let lastMessage: LastMessage | null = null

    if (rawLastMsg) {
      const content = rawLastMsg.deletedAt
        ? "Mensagem apagada"
        : rawLastMsg.type === "audio"
          ? "🎤 Mensagem de voz"
          : rawLastMsg.type === "image"
            ? "📷 Imagem"
            : rawLastMsg.content
              ? decrypt(rawLastMsg.content)
              : "Mensagem apagada"

      lastMessage = {
        id: rawLastMsg.id,
        content,
        type: rawLastMsg.type as LastMessage["type"],
        senderId: rawLastMsg.senderId,
        createdAt: rawLastMsg.createdAt,
      }
    }

    return {
      id: conv.id,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      participants: (participantsByConversation.get(conv.id) || []).map(p => ({
        id: p.id,
        name: p.name,
        username: p.username,
        displayUsername: p.displayUsername || p.username,
        image: p.image,
        bio: p.bio,
      })),
      lastMessage,
      unreadCount: unreadCountByConversation.get(conv.id) ?? 0,
    }
  })
}

export async function isParticipant(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      )
    )
    .limit(1)

  return !!participant
}

export async function getOtherParticipantIds(
  userId: string,
  conversationId: string
): Promise<string[]> {
  const participants = await db
    .select({ userId: conversationParticipants.userId })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        ne(conversationParticipants.userId, userId)
      )
    )

  return participants.map((p) => p.userId)
}
