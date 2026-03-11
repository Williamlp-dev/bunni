import type { api } from '@/lib/api'

type InferResponseData<T> = T extends (...args: any) => Promise<{ data: infer D; error: any }>
  ? D
  : never

type Messages = typeof api.messages
type Conversations = typeof api.conversations

export type MessagesResponse = InferResponseData<Messages['get']>

export type Message = MessagesResponse extends { messages: Array<infer M> }
  ? M
  : never

export type ConversationsResponse = InferResponseData<Conversations['get']>
export type Conversation = ConversationsResponse extends { conversations: Array<infer C> } ? C : never

export type Participant = Conversation extends { participants: Array<infer P> } ? P : never

export type ConversationsList = ConversationsResponse

type Friends = typeof api.friends
export type Friend = InferResponseData<Friends['index']['get']> extends { friends: Array<infer F> } ? F : never

type FriendRequests = typeof api.friends.requests
export type Request = InferResponseData<FriendRequests['pending']['get']> extends { requests: Array<infer R> } ? R : never

type Users = typeof api.users
export type UserSearchInfo = InferResponseData<Users['search']['get']> extends { users: Array<infer U> } ? U : never
