import { useRouteContext, createLazyFileRoute, useRouter } from "@tanstack/react-router"
import { useState, useRef } from "react"
import { Mail, Check, X, Pencil, LogOut, Loader2, AtSign, Camera, AlignLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InputRoot, InputField } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/ui/page-layout"
import { PageHeader } from "@/components/ui/page-header"
import { auth } from "@/lib/auth"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

export const Route = createLazyFileRoute("/_layout/profile")({
  component: ProfilePage,
})

const MAX_AVATAR_SIZE = 1 * 1024 * 1024
const MAX_BIO_LENGTH = 255
const BIO_WARN_THRESHOLD = 220
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
type AllowedAvatarType = (typeof ALLOWED_AVATAR_TYPES)[number]

function ProfilePage() {
  const { session } = useRouteContext({ from: "/_layout" })
  const router = useRouter()
  const user = session.user

  const [isEditingName, setIsEditingName] = useState(false)
  const [savedName, setSavedName] = useState(user.name)
  const [editingName, setEditingName] = useState(user.name)
  const [isLoadingName, setIsLoadingName] = useState(false)

  const [isEditingBio, setIsEditingBio] = useState(false)
  const [savedBio, setSavedBio] = useState(user.bio ?? null)
  const [editingBio, setEditingBio] = useState(user.bio ?? "")
  const [isLoadingBio, setIsLoadingBio] = useState(false)

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleStartEditingName = () => {
    setEditingName(savedName)
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    const trimmed = editingName.trim()
    if (!trimmed || trimmed === savedName) {
      setIsEditingName(false)
      return
    }

    setIsLoadingName(true)
    try {
      await auth.updateUser({ name: trimmed })
      setSavedName(trimmed)
      setIsEditingName(false)
    } catch {
      alert("Erro ao atualizar nome")
    } finally {
      setIsLoadingName(false)
    }
  }

  const handleCancelName = () => {
    setEditingName(savedName)
    setIsEditingName(false)
  }

  const handleStartEditingBio = () => {
    setEditingBio(savedBio ?? "")
    setIsEditingBio(true)
  }

  const handleSaveBio = async () => {
    const sanitized = editingBio.trim() || null

    if (sanitized === savedBio) {
      setIsEditingBio(false)
      return
    }

    setIsLoadingBio(true)
    try {
      const { error } = await auth.updateUser({ bio: sanitized } as Parameters<typeof auth.updateUser>[0])
      if (error) throw error
      setSavedBio(sanitized)
      setIsEditingBio(false)
    } catch {
      alert("Erro ao atualizar bio")
    } finally {
      setIsLoadingBio(false)
    }
  }

  const handleCancelBio = () => {
    setEditingBio(savedBio ?? "")
    setIsEditingBio(false)
  }

  const handleAvatarClick = () => {
    if (isUploadingAvatar) return
    setAvatarError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ""

    if (!ALLOWED_AVATAR_TYPES.includes(file.type as AllowedAvatarType)) {
      setAvatarError("Apenas JPEG, PNG e WEBP são permitidos")
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Tamanho máximo: 1MB")
      return
    }

    setIsUploadingAvatar(true)
    setAvatarError(null)

    try {
      const { data: presigned, error: presignedError } = await api.users.avatar["presigned-url"].post({
        contentType: file.type as AllowedAvatarType,
      })
      if (presignedError || !presigned) throw new Error("Falha ao gerar URL de upload")

      const uploadRes = await fetch(presigned.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!uploadRes.ok) throw new Error("Falha ao enviar imagem")

      const { data: updated, error: updateError } = await api.users.avatar.patch({ key: presigned.key })
      if (updateError || !updated) throw new Error("Falha ao atualizar avatar")

      await auth.updateUser({ image: presigned.publicUrl })
      setAvatarPreview(presigned.publicUrl)
      await router.invalidate()
    } catch {
      setAvatarError("Erro ao atualizar avatar. Tente novamente.")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const initials = user.name.slice(0, 2).toUpperCase()
  const username = user.displayUsername || user.username

  const bioLength = editingBio.length
  const bioRemaining = MAX_BIO_LENGTH - bioLength
  const isBioNearLimit = bioLength >= BIO_WARN_THRESHOLD
  const isBioOverLimit = bioLength > MAX_BIO_LENGTH

  return (
    <PageLayout>
      <PageHeader
        variant="inline"
        eyebrow="Perfil"
        title="Suas Informações"
        backTo="/chat"
        backLabel="Voltar para o chat"
      />

      <div className="space-y-3">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAvatarClick}
                className="relative group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Trocar foto de perfil"
              >
                <Avatar className="size-20 transition-opacity duration-150 group-hover:opacity-90">
                  <AvatarImage src={avatarPreview ?? (user.image ?? undefined)} alt={user.name} />
                  <AvatarFallback delay={0} className="bg-primary/10 text-primary text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {isUploadingAvatar ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <Loader2 className="size-5 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
                    <Camera className="size-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                )}
              </button>

              {avatarError && (
                <p className="text-xs text-destructive text-center max-w-[120px] leading-tight animate-in fade-in slide-in-from-top-1 duration-150">
                  {avatarError}
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex-1 space-y-5 w-full text-center sm:text-left">
              <FieldBlock
                label="Nome"
                isEditing={isEditingName}
                onEdit={handleStartEditingName}
                display={
                  <p className="text-lg font-semibold text-foreground tracking-tight">{savedName}</p>
                }
                editor={
                  <div className="flex items-center gap-2 max-w-xs mx-auto sm:mx-0">
                    <InputRoot className="flex-1 h-9 rounded-lg">
                      <InputField
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        disabled={isLoadingName}
                        className="text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName()
                          if (e.key === "Escape") handleCancelName()
                        }}
                      />
                    </InputRoot>
                    <ActionButtons
                      onSave={handleSaveName}
                      onCancel={handleCancelName}
                      isLoading={isLoadingName}
                      isDisabled={!editingName.trim()}
                      size="sm"
                    />
                  </div>
                }
              />

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Username
                </p>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <AtSign className="size-3.5 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium text-foreground">{username}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center size-9 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
              <AlignLeft className="size-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <FieldBlock
                label="Bio"
                isEditing={isEditingBio}
                onEdit={handleStartEditingBio}
                display={
                  savedBio ? (
                    <p className="text-sm font-medium text-foreground line-clamp-3">{savedBio}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Fale um pouco sobre você...</p>
                  )
                }
                editor={
                  <div className="space-y-2">
                    <textarea
                      value={editingBio}
                      onChange={(e) => setEditingBio(e.target.value)}
                      autoFocus
                      disabled={isLoadingBio}
                      rows={3}
                      maxLength={MAX_BIO_LENGTH + 10}
                      placeholder="Fale um pouco sobre você..."
                      className={cn(
                        "w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                        "transition-colors duration-150",
                        isBioOverLimit ? "border-destructive focus-visible:ring-destructive" : "border-input"
                      )}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") handleCancelBio()
                      }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs tabular-nums transition-all duration-150",
                          isBioOverLimit
                            ? "text-destructive font-semibold"
                            : isBioNearLimit
                              ? "text-amber-500 font-medium"
                              : "text-muted-foreground"
                        )}
                      >
                        {isBioNearLimit
                          ? `${bioRemaining} ${bioRemaining === 1 ? "caractere restante" : "caracteres restantes"}`
                          : `${bioLength} / ${MAX_BIO_LENGTH}`}
                      </p>
                      <ActionButtons
                        onSave={handleSaveBio}
                        onCancel={handleCancelBio}
                        isLoading={isLoadingBio}
                        isDisabled={isBioOverLimit}
                        size="sm"
                      />
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center size-9 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
              <Mail className="size-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                E-mail
              </p>
              <p className="text-sm font-medium text-foreground break-all">{user.email}</p>
              {user.emailVerified && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex items-center justify-center size-4 rounded-full bg-success/15">
                    <Check className="size-2.5 text-success" />
                  </div>
                  <p className="text-xs text-success font-medium">Verificado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={async () => {
              await auth.signOut()
              window.location.href = "/sign-in"
            }}
            variant="destructive"
            className="w-full sm:w-auto gap-2"
          >
            <LogOut className="size-4" />
            Sair da Conta
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}

type FieldBlockProps = {
  label: string
  isEditing: boolean
  onEdit: () => void
  display: React.ReactNode
  editor: React.ReactNode
}

function FieldBlock({ label, isEditing, onEdit, display, editor }: FieldBlockProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onEdit}
            className="size-5 text-muted-foreground/50 hover:text-foreground transition-all duration-150 hover:scale-110"
          >
            <Pencil className="size-3" />
          </Button>
        )}
      </div>

      <div
        className={cn(
          "transition-all duration-200",
          isEditing && "animate-in fade-in slide-in-from-top-1"
        )}
        key={isEditing ? "editing" : "display"}
      >
        {isEditing ? editor : display}
      </div>
    </div>
  )
}

type ActionButtonsProps = {
  onSave: () => void
  onCancel: () => void
  isLoading: boolean
  isDisabled?: boolean
  size?: "sm" | "md"
}

function ActionButtons({ onSave, onCancel, isLoading, isDisabled, size = "md" }: ActionButtonsProps) {
  const btnSize = size === "sm" ? "size-8" : "size-9"

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onSave}
        disabled={isLoading || isDisabled}
        size="icon"
        className={cn(btnSize, "shrink-0 rounded-lg transition-all duration-150 active:scale-95")}
      >
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
      </Button>
      <Button
        onClick={onCancel}
        disabled={isLoading}
        variant="outline"
        size="icon"
        className={cn(btnSize, "shrink-0 rounded-lg transition-all duration-150 active:scale-95")}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
