import { db } from "@/database/client"
import { friendRequests } from "@/database/schema/friend-requests"
import { friendships } from "@/database/schema/friendships"
import { users } from "@/database/schema/users"
import { conversations, conversationParticipants } from "@/database/schema/conversations"
import { eq, or, and, sql } from "drizzle-orm"
import { FriendServiceError } from "@/shared/errors/friend.errors"
import { isBlocked, areFriends, hasPendingRequest } from "@/shared/helpers/relationship.helpers"
import { sendToUser } from "@/modules/websocket/connection-manager"

export type FriendRequest = typeof friendRequests.$inferSelect
export type Friendship = typeof friendships.$inferSelect

const USER_SELECT_FIELDS = {
  id: users.id,
  name: users.name,
  username: users.username,
  displayUsername: users.displayUsername,
  image: users.image,
}

export async function sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
  if (senderId === receiverId) {
    throw new FriendServiceError("Você não pode enviar pedido de amizade para você mesmo", "SELF_REQUEST")
  }

  if (await isBlocked(senderId, receiverId)) {
    throw new FriendServiceError("Não é possível enviar pedido de amizade", "BLOCKED")
  }

  if (await areFriends(senderId, receiverId)) {
    throw new FriendServiceError("Vocês já são amigos", "ALREADY_FRIENDS")
  }

  if (await hasPendingRequest(senderId, receiverId)) {
    throw new FriendServiceError("Já existe um pedido de amizade pendente", "ALREADY_REQUESTED")
  }

  const [request] = await db.insert(friendRequests).values({ senderId, receiverId }).returning()

  const requestWithSender = await getPendingRequests(receiverId).then(reqs => reqs.find(r => r.id === request.id))
  if (requestWithSender) {
    sendToUser(receiverId, "friend:request-received", requestWithSender)
  }

  return request
}

export async function acceptFriendRequest(requestId: string, userId: string): Promise<Friendship> {
  const [request] = await db.select().from(friendRequests).where(eq(friendRequests.id, requestId)).limit(1)

  if (!request) throw new FriendServiceError("Pedido de amizade não encontrado", "NOT_FOUND")
  if (request.receiverId !== userId) throw new FriendServiceError("Você não tem permissão para aceitar este pedido", "UNAUTHORIZED")

  const friendship = await db.transaction(async (tx) => {
    await tx.delete(friendRequests).where(eq(friendRequests.id, requestId))

    const [userOneId, userTwoId] = [request.senderId, request.receiverId].sort()
    const [f] = await tx.insert(friendships).values({ userOneId, userTwoId }).returning()

    const [conversation] = await tx.insert(conversations).values({}).returning()
    await tx.insert(conversationParticipants).values([
      { conversationId: conversation.id, userId: request.senderId },
      { conversationId: conversation.id, userId: request.receiverId },
    ])

    return { friendship: f, conversationId: conversation.id }
  })

  const [acceptor] = await db.select(USER_SELECT_FIELDS).from(users).where(eq(users.id, userId)).limit(1)

  if (acceptor) {
    sendToUser(request.senderId, "friend:request-accepted", {
      user: { ...acceptor, displayUsername: acceptor.displayUsername || acceptor.username },
    })
  }

  const { getConversationById } = await import("@/modules/conversations/conversation.service")
  const conversationData = await getConversationById(friendship.conversationId)

  if (conversationData) {
    sendToUser(request.senderId, "conversation:created", conversationData)
    sendToUser(request.receiverId, "conversation:created", conversationData)
  }

  return friendship.friendship
}

export async function rejectFriendRequest(requestId: string, userId: string): Promise<void> {
  const [request] = await db.select().from(friendRequests).where(eq(friendRequests.id, requestId)).limit(1)

  if (!request) throw new FriendServiceError("Pedido de amizade não encontrado", "NOT_FOUND")
  if (request.receiverId !== userId) throw new FriendServiceError("Você não tem permissão para recusar este pedido", "UNAUTHORIZED")

  await db.delete(friendRequests).where(eq(friendRequests.id, requestId))
}

export async function cancelFriendRequest(requestId: string, userId: string): Promise<void> {
  const [request] = await db.select().from(friendRequests).where(eq(friendRequests.id, requestId)).limit(1)

  if (!request) throw new FriendServiceError("Pedido de amizade não encontrado", "NOT_FOUND")
  if (request.senderId !== userId) throw new FriendServiceError("Você não tem permissão para cancelar este pedido", "UNAUTHORIZED")

  await db.delete(friendRequests).where(eq(friendRequests.id, requestId))
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const deleted = await db.delete(friendships).where(
    or(
      and(eq(friendships.userOneId, userId), eq(friendships.userTwoId, friendId)),
      and(eq(friendships.userOneId, friendId), eq(friendships.userTwoId, userId))
    )
  ).returning()

  if (deleted.length === 0) throw new FriendServiceError("Amizade não encontrada", "NOT_FOUND")
}

export async function getFriends(userId: string) {
  const results = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      displayUsername: users.displayUsername,
      image: users.image,
      friendsSince: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(
      users,
      sql`CASE 
        WHEN ${friendships.userOneId} = ${userId} THEN ${friendships.userTwoId} 
        ELSE ${friendships.userOneId} 
      END = ${users.id}`
    )
    .where(
      or(
        eq(friendships.userOneId, userId),
        eq(friendships.userTwoId, userId)
      )
    )

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    username: row.username,
    displayUsername: row.displayUsername || row.username,
    image: row.image,
    friendsSince: row.friendsSince,
  }))
}

export async function getPendingRequests(userId: string) {
  const results = await db
    .select({
      id: friendRequests.id,
      createdAt: friendRequests.createdAt,
      sender: USER_SELECT_FIELDS,
    })
    .from(friendRequests)
    .innerJoin(users, eq(friendRequests.senderId, users.id))
    .where(eq(friendRequests.receiverId, userId))

  return results.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    sender: {
      ...row.sender,
      displayUsername: row.sender.displayUsername || row.sender.username,
    },
  }))
}

export async function getSentRequests(userId: string) {
  const results = await db
    .select({
      id: friendRequests.id,
      createdAt: friendRequests.createdAt,
      receiver: USER_SELECT_FIELDS,
    })
    .from(friendRequests)
    .innerJoin(users, eq(friendRequests.receiverId, users.id))
    .where(eq(friendRequests.senderId, userId))

  return results.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    receiver: {
      ...row.receiver,
      displayUsername: row.receiver.displayUsername || row.receiver.username,
    },
  }))
}
