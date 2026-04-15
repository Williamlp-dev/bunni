import { useChatStore } from "@/modules/chat/store/chat-store"

export function useIsOnline(userId: string | undefined): boolean {
  return useChatStore((s) => (userId ? s.presenceMap[userId] === "online" : false))
}
