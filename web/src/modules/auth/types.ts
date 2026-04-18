export type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  isVerified?: boolean | null
  image?: string | null
  username?: string | null
  displayUsername?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

export type UserBasicInfo = {
  id: string
  name: string
  isVerified?: boolean
  image?: string | null
  username?: string | null
  displayUsername?: string | null
}

export type UserSearchResponse = {
  users: UserBasicInfo[]
}

export type UserProfileResponse = {
  user: User
}
