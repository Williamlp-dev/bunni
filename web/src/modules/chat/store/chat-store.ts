import { create } from "zustand"

type PresenceStatus = "online" | "offline"

type ChatState = {
  typingUsers: Record<string, string | null>
  presenceMap: Record<string, PresenceStatus>
  activeConversationId: string | undefined
}

type ChatActions = {
  setTyping: (conversationId: string, userId: string | null) => void
  setPresence: (userId: string, status: PresenceStatus) => void
  resetPresence: () => void
  setActiveConversationId: (id: string | undefined) => void
}

export type ChatStore = ChatState & ChatActions

export const useChatStore = create<ChatStore>((set) => ({
  typingUsers: {},
  presenceMap: {},
  activeConversationId: undefined,

  setTyping: (conversationId, userId) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [conversationId]: userId },
    })),

  setPresence: (userId, status) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: status },
    })),

  resetPresence: () => set({ presenceMap: {} }),

  setActiveConversationId: (id) => set({ activeConversationId: id }),
}))
