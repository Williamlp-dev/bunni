import { create } from "zustand"

type SidebarState = {
  isRequestsDialogOpen: boolean
  isAddFriendDialogOpen: boolean
  setRequestsDialogOpen: (isOpen: boolean) => void
  setAddFriendDialogOpen: (isOpen: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isRequestsDialogOpen: false,
  isAddFriendDialogOpen: false,
  setRequestsDialogOpen: (isOpen) => set({ isRequestsDialogOpen: isOpen }),
  setAddFriendDialogOpen: (isOpen) => set({ isAddFriendDialogOpen: isOpen }),
}))
