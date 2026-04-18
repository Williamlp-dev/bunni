import { useRouteContext, createLazyFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import {
  Mail,
  Check,
  LogOut,
  Loader2,
  AtSign,
  Camera,
  AlignLeft,
  BadgeCheck,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InputRoot, InputField } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/ui/page-layout"
import { PageHeader } from "@/components/ui/page-header"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { useProfileAvatar } from "@/modules/profile/hooks/use-profile-avatar"
import { DeleteAccountDialog } from "@/modules/profile/components/delete-account-dialog"
import { FieldBlock } from "@/modules/profile/components/field-block"
import { ActionButtons } from "@/modules/profile/components/action-buttons"
import { getUserInitials } from "@/modules/auth/hooks/use-current-user"

export const Route = createLazyFileRoute("/_layout/profile")({
  component: ProfilePage,
})

const MAX_BIO_LENGTH = 255
const BIO_WARN_THRESHOLD = 220

function ProfilePage() {
  const { session } = useRouteContext({ from: "/_layout" })
  const user = session.user
  console.log("Current user object:", user)

  const [isEditingName, setIsEditingName] = useState(false)
  const [savedName, setSavedName] = useState(user.name)
  const [editingName, setEditingName] = useState(user.name)
  const [isLoadingName, setIsLoadingName] = useState(false)

  const [isEditingBio, setIsEditingBio] = useState(false)
  const [savedBio, setSavedBio] = useState(user.bio ?? null)
  const [editingBio, setEditingBio] = useState(user.bio ?? "")
  const [isLoadingBio, setIsLoadingBio] = useState(false)

  const avatar = useProfileAvatar()

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

  const initials = getUserInitials(user.name)
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
        backLabel="Voltar"
      />

      <div className="space-y-3">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex flex-row items-start gap-6">
            <div className="flex flex-col items-start gap-1.5 shrink-0">
              <button
                type="button"
                onClick={avatar.handleAvatarClick}
                className="relative group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform duration-200 active:scale-95"
                aria-label="Trocar foto de perfil"
              >
                <Avatar className="size-20 shadow-sm border border-border/40">
                  <AvatarImage src={avatar.avatarPreview ?? (user.image ?? undefined)} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {avatar.isUploading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-background/50 backdrop-blur-sm">
                    <Loader2 className="size-6 text-primary animate-spin" />
                  </div>
                )}

                {!avatar.isUploading && (
                  <div className="absolute -bottom-1 -right-1 z-20 flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground border-[3px] border-card shadow-sm">
                    <Camera className="size-4" />
                  </div>
                )}
              </button>

              {avatar.error && (
                <p className="text-xs text-destructive text-center max-w-[120px] leading-tight animate-in fade-in slide-in-from-top-1 duration-150">
                  {avatar.error}
                </p>
              )}

              <input
                ref={avatar.fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={avatar.handleFileChange}
              />
            </div>

            <div className="flex-1 space-y-5 w-full">
              <FieldBlock
                label="Nome"
                isEditing={isEditingName}
                onEdit={() => setIsEditingName(true)}
                display={
                  <div className="flex items-center gap-1.5">
                    <p className="text-lg font-semibold text-foreground tracking-tight">{savedName}</p>
                    {user.isVerified && (
                      <BadgeCheck className="size-5 text-primary" />
                    )}
                  </div>
                }
                editor={
                  <div className="flex items-center gap-2 w-full">
                    <InputRoot className="flex-1 h-10 rounded-lg">
                      <InputField
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        disabled={isLoadingName}
                        className="text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName()
                          if (e.key === "Escape") {
                            setEditingName(savedName)
                            setIsEditingName(false)
                          }
                        }}
                      />
                    </InputRoot>
                    <ActionButtons
                      onSave={handleSaveName}
                      onCancel={() => { setEditingName(savedName); setIsEditingName(false) }}
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
                <div className="flex items-center gap-1.5">
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
                onEdit={() => { setEditingBio(savedBio ?? ""); setIsEditingBio(true) }}
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
                        isBioOverLimit ? "border-destructive focus-visible:ring-destructive" : "border-input"
                      )}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditingBio(savedBio ?? "")
                          setIsEditingBio(false)
                        }
                      }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs tabular-nums",
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
                        onCancel={() => { setEditingBio(savedBio ?? ""); setIsEditingBio(false) }}
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

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={async () => {
              await auth.signOut()
              window.location.href = "/sign-in"
            }}
            variant="destructive"
            size="sm"
            className="btn-press w-full sm:w-auto gap-2"
          >
            <LogOut className="size-4" />
            Sair da Conta
          </Button>

          <DeleteAccountDialog />
        </div>
      </div>
    </PageLayout>
  )
}


