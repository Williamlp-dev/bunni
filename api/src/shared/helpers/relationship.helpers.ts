import { db } from "@/database/client"
import { blocks } from "@/database/schema/blocks"
import { friendships } from "@/database/schema/friendships"
import { friendRequests } from "@/database/schema/friend-requests"
import { eq, and, or } from "drizzle-orm"
import { getCachedBlockStatus, setCachedBlockStatus } from "@/shared/cache/block-cache"

export async function isBlocked(userId1: string, userId2: string): Promise<boolean> {
  const cached = getCachedBlockStatus(userId1, userId2)
  if (cached !== null) return cached

  const block = await db
    .select()
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, userId1), eq(blocks.blockedId, userId2)),
        and(eq(blocks.blockerId, userId2), eq(blocks.blockedId, userId1))
      )
    )
    .limit(1)

  const result = block.length > 0
  setCachedBlockStatus(userId1, userId2, result)
  return result
}

export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const friendship = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.userOneId, userId1), eq(friendships.userTwoId, userId2)),
        and(eq(friendships.userOneId, userId2), eq(friendships.userTwoId, userId1))
      )
    )
    .limit(1)

  return friendship.length > 0
}

export async function hasPendingRequest(senderId: string, receiverId: string): Promise<boolean> {
  const request = await db
    .select()
    .from(friendRequests)
    .where(
      or(
        and(eq(friendRequests.senderId, senderId), eq(friendRequests.receiverId, receiverId)),
        and(eq(friendRequests.senderId, receiverId), eq(friendRequests.receiverId, senderId))
      )
    )
    .limit(1)

  return request.length > 0
}
