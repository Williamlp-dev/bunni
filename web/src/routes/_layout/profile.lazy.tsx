import { useRouteContext, createLazyFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Mail, Check, X, Pencil, LogOut, Loader2, AtSign } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InputRoot, InputField } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/ui/page-layout"
import { PageHeader } from "@/components/ui/page-header"
import { auth } from "@/lib/auth"

export const Route = createLazyFileRoute("/_layout/profile")({
  component: ProfilePage,
})

function ProfilePage() {
  const { session } = useRouteContext({ from: "/_layout" })
  const user = session.user

  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState(user.name)
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveName = async () => {
    if (!name || name === user.name) {
      setIsEditingName(false)
      return
    }

    setIsLoading(true)
    try {
      await auth.updateUser({ name })
      setIsEditingName(false)
    } catch (error) {
      console.error("Failed to update name", error)
      alert("Erro ao atualizar nome")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelName = () => {
    setName(user.name)
    setIsEditingName(false)
  }

  const initials = user.name.slice(0, 2).toUpperCase()
  const username = user.displayUsername || user.username

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
            <Avatar className="size-20 shrink-0">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-5 w-full text-center sm:text-left">
              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Nome
                  </p>
                  {!isEditingName && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setIsEditingName(true)}
                      className="size-5 text-muted-foreground/60 hover:text-foreground"
                    >
                      <Pencil className="size-3" />
                    </Button>
                  )}
                </div>

                {isEditingName ? (
                  <div className="flex items-center gap-2 max-w-xs mx-auto sm:mx-0">
                    <InputRoot className="flex-1 h-9 rounded-lg">
                      <InputField
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        className="text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName()
                          if (e.key === "Escape") handleCancelName()
                        }}
                      />
                    </InputRoot>
                    <Button
                      onClick={handleSaveName}
                      disabled={isLoading}
                      size="icon"
                      className="size-9 shrink-0 rounded-lg"
                    >
                      {isLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelName}
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0 rounded-lg"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-foreground tracking-tight">
                    {name}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Username
                </p>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <AtSign className="size-3.5 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium text-foreground">
                    {username}
                  </p>
                </div>
              </div>
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
              <p className="text-sm font-medium text-foreground break-all">
                {user.email}
              </p>
              {user.emailVerified && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex items-center justify-center size-4 rounded-full bg-success/15">
                    <Check className="size-2.5 text-success" />
                  </div>
                  <p className="text-xs text-success font-medium">
                    Verificado
                  </p>
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
