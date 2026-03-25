import { t, type Static } from "elysia"

export const UpdateBioBodySchema = t.Object({
  bio: t.Union([t.String({ maxLength: 255 }), t.Null()]),
})

export type UpdateBioBody = Static<typeof UpdateBioBodySchema>

export const UserBasicSchema = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.Union([t.String(), t.Null()]),
  displayUsername: t.String(),
  image: t.Union([t.String(), t.Null()]),
})

export type UserBasic = Static<typeof UserBasicSchema>

export const UserSearchQuerySchema = t.Object({
  q: t.String({ minLength: 2, error: "Query must be at least 2 characters" }),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50, default: 20 })),
})

export type UserSearchQuery = Static<typeof UserSearchQuerySchema>

export const UserSearchResponseSchema = t.Object({
  users: t.Array(UserBasicSchema),
})

export type UserSearchResponse = Static<typeof UserSearchResponseSchema>

export const UserParamSchema = t.Object({
  id: t.String({ format: "uuid" }),
})

export const UsernameParamSchema = t.Object({
  username: t.String({ minLength: 1 }),
})

export const BlockedUserSchema = t.Object({
  id: t.String({ format: "uuid" }),
  user: t.Optional(UserBasicSchema),
  blockedAt: t.Date(),
})

export type BlockedUser = Static<typeof BlockedUserSchema>

export const BlockedUsersResponseSchema = t.Object({
  blocked: t.Array(BlockedUserSchema),
})


export type UserBasicInfo = {
  id: string
  name: string | null
  displayUsername: string
  username: string
  image: string | null
}

export const USER_SELECT_FIELDS = {
  id: true,
  name: true,
  displayUsername: true,
  username: true,
  image: true,
} as const
