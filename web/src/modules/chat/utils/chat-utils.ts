import type { Conversation, Participant, Message } from "@/lib/eden-types"
import type { UserBasicInfo } from "@/modules/auth/types"

type LastMessage = NonNullable<Conversation["lastMessage"]>

export function formatLastMessagePreview(
  lastMessage: LastMessage,
  currentUserId: string
): string {
  if (lastMessage.type === "image") return "📷 Foto"
  if (lastMessage.type === "audio") return "🎤 Áudio"
  const prefix = lastMessage.senderId === currentUserId ? "Você: " : ""
  return `${prefix}${lastMessage.content}`
}

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
  return date.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const grouped: Record<string, Message[]> = {}

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  const formatter = new Intl.DateTimeFormat('pt-BR', options)

  const now = new Date()
  const todayParts = formatter.formatToParts(now)
  const todayStr = formatter.format(now)

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = formatter.format(yesterday)

  const currentYear = todayParts.find(p => p.type === 'year')?.value

  for (const message of sortedMessages) {
    const messageDate = new Date(message.createdAt)
    const dateStr = formatter.format(messageDate)

    let groupKey = dateStr
    if (dateStr === todayStr) {
      groupKey = "Hoje"
    } else if (dateStr === yesterdayStr) {
      groupKey = "Ontem"
    } else {
      const parts = formatter.formatToParts(messageDate)
      const day = parts.find(p => p.type === 'day')?.value
      const month = parts.find(p => p.type === 'month')?.value
      const year = parts.find(p => p.type === 'year')?.value

      groupKey = `${day} de ${month}`
      if (year !== currentYear) {
        groupKey += ` de ${year}`
      }
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = []
    }
    grouped[groupKey].push(message)
  }

  return grouped
}
