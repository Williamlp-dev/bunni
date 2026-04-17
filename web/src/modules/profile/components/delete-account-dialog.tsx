import { useState } from "react"
import { Loader2, Trash2, TriangleAlert, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputRoot, InputField } from "@/components/ui/input"
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (open: boolean) => {
    if (isDeleting) return
    setIsOpen(open)
    if (!open) {
      setPassword("")
      setError(null)
    }
  }

  const handleDelete = async () => {
    if (!password.trim()) {
      setError("Informe sua senha para confirmar.")
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const { error: deleteError } = await auth.deleteUser({ password })
      if (deleteError) {
        setError("Senha incorreta ou erro inesperado. Tente novamente.")
        return
      }
      window.location.href = "/sign-in"
    } catch {
      setError("Erro inesperado. Tente novamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="destructive-outline" size="sm" className="btn-press w-full sm:w-auto gap-2">
            <Trash2 className="size-4" />
            Deletar Conta
          </Button>
        }
      />

      <DialogPopup showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-destructive/10 shrink-0">
              <TriangleAlert className="size-5 text-destructive" />
            </div>
            <DialogTitle>Deletar conta?</DialogTitle>
          </div>
          <DialogDescription>
            Essa ação é{" "}
            <span className="font-semibold text-foreground">permanente e irreversível</span>.
            Todos os seus dados, mensagens e configurações serão apagados para sempre.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 px-6 pb-2">
          <label
            htmlFor="delete-password"
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Confirme com sua senha
          </label>
          <InputRoot className={cn(error && "border-destructive focus-within:ring-destructive")}>
            <InputField
              id="delete-password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              disabled={isDeleting}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDelete()
              }}
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="btn-press text-muted-foreground hover:text-foreground hover:bg-transparent data-pressed:bg-transparent shrink-0 mr-1"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </Button>
          </InputRoot>
          {error && (
            <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-150">
              {error}
            </p>
          )}
        </div>

        <DialogFooter variant="bare">
          <DialogClose
            disabled={isDeleting}
            render={<Button variant="outline" className="btn-press flex-1 sm:flex-none" />}
          >
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !password.trim()}
            className="btn-press flex-1 sm:flex-none gap-2"
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {isDeleting ? "Deletando..." : "Deletar Conta"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
