import type { ConversationsList, MessageStatusType } from "@/lib/eden-types"

export const TYPING_THROTTLE_MS = 2000
export const TYPING_TIMEOUT_MS = 3000

export const STATUS_PRIORITY: Record<string, number> = {
  error: 0,
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
}

export function resolveStatus(
  cached: string | undefined,
  incoming: string
): MessageStatusType {
  const cachedPriority = STATUS_PRIORITY[cached ?? ""] ?? -1
  const incomingPriority = STATUS_PRIORITY[incoming] ?? 0
  return (cachedPriority > incomingPriority ? cached! : incoming) as MessageStatusType
}

type ConvItem = NonNullable<ConversationsList>["conversations"][number]

export function sortConversationsByActivity(conversations: ConvItem[]): ConvItem[] {
  return [...conversations].sort((a, b) => {
    const aDate = a.lastMessage
      ? new Date(a.lastMessage.createdAt).getTime()
      : new Date(a.updatedAt).getTime()
    const bDate = b.lastMessage
      ? new Date(b.lastMessage.createdAt).getTime()
      : new Date(b.updatedAt).getTime()
    return bDate - aDate
  })
}
