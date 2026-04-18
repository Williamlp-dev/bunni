import { useState, useRef } from "react"
import { useRouter } from "@tanstack/react-router"
import { auth } from "@/lib/auth"
import { api } from "@/lib/api"
import { queryClient } from "@/lib/query-client"

const MAX_AVATAR_SIZE = 1 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
type AllowedAvatarType = (typeof ALLOWED_AVATAR_TYPES)[number]

type UseProfileAvatarReturn = {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  avatarPreview: string | null
  isUploading: boolean
  error: string | null
  handleAvatarClick: () => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

export function useProfileAvatar(): UseProfileAvatarReturn {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAvatarClick = () => {
    if (isUploading) return
    setError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ""

    if (!ALLOWED_AVATAR_TYPES.includes(file.type as AllowedAvatarType)) {
      setError("Apenas JPEG, PNG e WEBP são permitidos")
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Tamanho máximo: 1MB")
      return
    }

    setIsUploading(true)
    setError(null)
    
    // Preview instantâneo
    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)

    try {
      const { data: presigned, error: presignedError } = await api.users.avatar["presigned-url"].post({
        contentType: file.type as AllowedAvatarType,
      })
      if (presignedError || !presigned) throw new Error()

      const uploadRes = await fetch(presigned.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!uploadRes.ok) throw new Error()

      const { data: updated, error: updateError } = await api.users.avatar.patch({ key: presigned.key })
      if (updateError || !updated) throw new Error()

      await auth.updateUser({ image: presigned.publicUrl })
      
      // Atualizar cache de sessão para garantir que tudo pegue a nova imagem sem F5
      await queryClient.invalidateQueries({ queryKey: ["auth-session"] })
      await router.invalidate()
      
      setAvatarPreview(presigned.publicUrl)
    } catch {
      setError("Erro ao atualizar avatar. Tente novamente.")
      setAvatarPreview(null) // Resetar o preview em caso de erro
    } finally {
      setIsUploading(false)
      URL.revokeObjectURL(localUrl)
    }
  }

  return { fileInputRef, avatarPreview, isUploading, error, handleAvatarClick, handleFileChange }
}
