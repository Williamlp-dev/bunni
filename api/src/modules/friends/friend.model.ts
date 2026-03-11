import { t, type Static } from "elysia"
import { UserBasicSchema } from "@/modules/users/user.model"

export const FriendRequestSchema = t.Object({
  id: t.String({ format: "uuid" }),
  senderId: t.String({ format: "uuid" }),
  receiverId: t.String({ format: "uuid" }),
  createdAt: t.String({ format: "date-time" }),
  sender: UserBasicSchema,
  receiver: t.Optional(UserBasicSchema),
})

export type FriendRequest = Static<typeof FriendRequestSchema>

export const UsernameBodySchema = t.Object({
  username: t.String({ minLength: 1 }),
})

export const FriendRequestsResponseSchema = t.Object({
  requests: t.Array(FriendRequestSchema),
})

export const FriendsResponseSchema = t.Object({
  friends: t.Array(UserBasicSchema),
})
