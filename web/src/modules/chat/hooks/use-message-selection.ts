import { create } from "zustand"
import type { Message } from "@/lib/eden-types"

type MessageSelectionState = {
  selectedMessages: Map<string, Message>
  isSelectionMode: boolean
  toggleMessage: (message: Message) => void
  selectMessage: (message: Message) => void
  clearSelection: () => void
  copySelectedContent: () => Promise<void>
  getSelectedCount: () => number
  getSelectedIds: () => string[]
}

export const useMessageSelection = create<MessageSelectionState>((set, get) => ({
  selectedMessages: new Map(),
  isSelectionMode: false,

  toggleMessage: (message: Message) => {
    const { selectedMessages } = get()
    const newMap = new Map(selectedMessages)

    if (newMap.has(message.id)) {
      newMap.delete(message.id)
    } else {
      newMap.set(message.id, message)
    }

    set({
      selectedMessages: newMap,
      isSelectionMode: newMap.size > 0
    })
  },

  selectMessage: (message: Message) => {
    const newMap = new Map()
    newMap.set(message.id, message)
    set({ selectedMessages: newMap, isSelectionMode: true })
  },

  clearSelection: () => {
    set({ selectedMessages: new Map(), isSelectionMode: false })
  },

  copySelectedContent: async () => {
    const { selectedMessages } = get()
    const contents = Array.from(selectedMessages.values())
      .map((m) => m.content)
      .join("\n\n")

    if (contents) {
      await navigator.clipboard.writeText(contents)
    }
  },

  getSelectedCount: () => get().selectedMessages.size,

  getSelectedIds: () => Array.from(get().selectedMessages.keys()),
}))
