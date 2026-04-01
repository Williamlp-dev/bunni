import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

export function useBlockStatus(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "block-status"],
    queryFn: async () => {
      const { data, error } = await api.users({ id: userId })["block-status"].get()
      if (error) throw new Error(error.value as string)
      return data
    },
    enabled: !!userId,
  })
}

export function useBlockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await api.users({ id: userId }).block.post()
      
      if (error) {
        throw new Error(error.value as string)
      }
      return data
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users", userId, "block-status"] })
      toast.success("Usuário bloqueado com sucesso.")
    },
    onError: () => {
      toast.error("Falha ao bloquear usuário.")
    },
  })
}

export function useUnblockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await api.users({ id: userId }).block.delete()
      
      if (error) {
        throw new Error(error.value as string)
      }
      return data
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users", userId, "block-status"] })
      toast.success("Usuário desbloqueado com sucesso.")
    },
    onError: () => {
      toast.error("Falha ao desbloquear usuário.")
    },
  })
}
