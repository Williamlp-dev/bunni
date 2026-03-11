import type { Conversation, Participant } from "@/lib/eden-types"
import type { UserBasicInfo } from "@/modules/auth/types"

export function getOtherParticipant(
  conversation: Conversation,
  currentUserId: string
): UserBasicInfo | null {
  const participant = conversation.participants.find(
    (p: Participant) => p.id !== currentUserId
  )
  return participant ?? null
}

export function formatTimestamp(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}
