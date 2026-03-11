import { and, eq, sql, inArray } from "drizzle-orm"
import { db } from "@/database/client"
import {
  conversations,
  conversationParticipants,
} from "@/database/schema/conversations"
import { users } from "@/database/schema/users"
import { getUserByUsername } from "@/modules/users/user.service"
import { areFriends } from "@/shared/helpers/relationship.helpers"
import { ConversationServiceError } from "@/shared/errors/conversation.errors"
import type { UserBasicInfo } from "@/modules/users/user.model"


type ConversationWithParticipants = {
  id: string
  createdAt: Date
  updatedAt: Date
  participants: UserBasicInfo[]
}


export async function createConversation(
  creatorId: string,
  participantId: string
): Promise<ConversationWithParticipants> {
  validateNotSelf(creatorId, participantId)
  await validateFriendship(creatorId, participantId)

  const existing = await findExistingConversation(creatorId, participantId)
  if (existing) return existing

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
      })),
    }
  })
}

async function findExistingConversation(
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
    })),
  }
}

export async function getUserConversations(
  userId: string
): Promise<ConversationWithParticipants[]> {
  const userConversationIds = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId))

  if (userConversationIds.length === 0) return []

  const conversationIds = userConversationIds.map(c => c.conversationId)

  const conversationsData = await db
    .select({
      id: conversations.id,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(inArray(conversations.id, conversationIds))
    .orderBy(sql`${conversations.updatedAt} DESC`)

  const allParticipants = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      id: users.id,
      name: users.name,
      username: users.username,
      displayUsername: users.displayUsername,
      image: users.image,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(conversationParticipants.userId, users.id))
    .where(inArray(conversationParticipants.conversationId, conversationIds))

  const participantsByConversation = new Map<string, typeof allParticipants>()
  for (const participant of allParticipants) {
    const existing = participantsByConversation.get(participant.conversationId) || []
    participantsByConversation.set(participant.conversationId, [...existing, participant])
  }

  return conversationsData.map(conv => ({
    id: conv.id,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    participants: (participantsByConversation.get(conv.id) || []).map(p => ({
      id: p.id,
      name: p.name,
      username: p.username,
      displayUsername: p.displayUsername || p.username,
      image: p.image,
    })),
  }))
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
