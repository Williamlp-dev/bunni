import { db } from "@/database/client"
import { users } from "@/database/schema/users"
import { blocks } from "@/database/schema/blocks"
import { friendships } from "@/database/schema/friendships"
import { friendRequests } from "@/database/schema/friend-requests"
import { eq, and, or, ilike, ne, sql } from "drizzle-orm"
import { UserServiceError } from "@/shared/errors/user.errors"
import { sendToUser } from "@/modules/websocket/connection-manager"
import { deleteFromR2 } from "@/modules/uploads/upload.service"
import { env } from "@/env"

const USER_FIELDS = {
  id: users.id,
  name: users.name,
  username: users.username,
  displayUsername: users.displayUsername,
  image: users.image,
  bio: users.bio,
}

export async function searchUsers(query: string, currentUserId: string, limit = 20) {
  if (!query || query.length < 2) return []

  const rows = await db.select(USER_FIELDS).from(users).where(
    and(
      or(ilike(users.username, `%${query}%`), ilike(users.name, `%${query}%`)),
      ne(users.id, currentUserId),
      sql`NOT EXISTS (
        SELECT 1 FROM ${blocks} 
        WHERE ${blocks.blockerId} = ${currentUserId} 
        AND ${blocks.blockedId} = ${users.id}
      )`,
      sql`NOT EXISTS (
        SELECT 1 FROM ${blocks} 
        WHERE ${blocks.blockerId} = ${users.id} 
        AND ${blocks.blockedId} = ${currentUserId}
      )`
    )
  ).limit(limit)

  return rows.map(row => ({
    ...row,
    displayUsername: row.displayUsername || row.username
  }))
}

export async function getUserById(userId: string) {
  const [user] = await db.select({ ...USER_FIELDS, createdAt: users.createdAt })
    .from(users).where(eq(users.id, userId)).limit(1)

  if (!user) return null

  return {
    ...user,
    displayUsername: user.displayUsername || user.username
  }
}

export async function getUserByUsername(username: string) {
  const [user] = await db.select({ ...USER_FIELDS, createdAt: users.createdAt })
    .from(users)
    .where(
      or(
        eq(users.username, username.toLowerCase()),
        eq(users.displayUsername, username)
      )
    )
    .limit(1)

  if (!user) return null

  return {
    ...user,
    displayUsername: user.displayUsername || user.username
  }
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  if (blockerId === blockedId) throw new UserServiceError("Você não pode bloquear a si mesmo", "SELF_BLOCK")

  const [existingBlock] = await db.select().from(blocks)
    .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId))).limit(1)

  if (existingBlock) throw new UserServiceError("Usuário já está bloqueado", "ALREADY_BLOCKED")

  await db.transaction(async (tx) => {
    await tx.delete(friendships).where(
      or(
        and(eq(friendships.userOneId, blockerId), eq(friendships.userTwoId, blockedId)),
        and(eq(friendships.userOneId, blockedId), eq(friendships.userTwoId, blockerId))
      )
    )

    await tx.delete(friendRequests).where(
      or(
        and(eq(friendRequests.senderId, blockerId), eq(friendRequests.receiverId, blockedId)),
        and(eq(friendRequests.senderId, blockedId), eq(friendRequests.receiverId, blockerId))
      )
    )

    await tx.insert(blocks).values({ blockerId, blockedId })
  })
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const deleted = await db.delete(blocks)
    .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId))).returning()

  if (deleted.length === 0) throw new UserServiceError("Usuário não está bloqueado", "NOT_BLOCKED")
}

export async function getBlockedUsers(userId: string) {
  const results = await db
    .select({
      blockId: blocks.id,
      blockedAt: blocks.createdAt,
      user: USER_FIELDS,
    })
    .from(blocks)
    .innerJoin(users, eq(blocks.blockedId, users.id))
    .where(eq(blocks.blockerId, userId))

  return results.map((row) => ({
    id: row.blockId,
    blockedAt: row.blockedAt,
    user: {
      ...row.user,
      displayUsername: row.user.displayUsername || row.user.username,
    },
  }))
}

export async function notifyOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  const friendIds = await db
    .select({
      friendId: sql<string>`CASE 
        WHEN ${friendships.userOneId} = ${userId} THEN ${friendships.userTwoId} 
        ELSE ${friendships.userOneId} 
      END`,
    })
    .from(friendships)
    .where(
      or(
        eq(friendships.userOneId, userId),
        eq(friendships.userTwoId, userId)
      )
    )

  for (const { friendId } of friendIds) {
    sendToUser(friendId, isOnline ? "user:online" : "user:offline", { userId })
  }
}

export async function updateAvatar(userId: string, key: string): Promise<{ image: string }> {
  const [currentUser] = await db
    .select({ image: users.image })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const newPublicUrl = `${env.R2_PUBLIC_DOMAIN}/${key}`

  if (currentUser?.image && currentUser.image.startsWith(env.R2_PUBLIC_DOMAIN)) {
    const oldKey = currentUser.image.slice(env.R2_PUBLIC_DOMAIN.length + 1)
    await deleteFromR2(oldKey).catch(() => null)
  }

  await db.update(users).set({ image: newPublicUrl }).where(eq(users.id, userId))

  return { image: newPublicUrl }
}

export async function updateBio(userId: string, bio: string | null): Promise<{ bio: string | null }> {
  const sanitized = bio?.trim() || null

  await db.update(users).set({ bio: sanitized }).where(eq(users.id, userId))

  return { bio: sanitized }
}
