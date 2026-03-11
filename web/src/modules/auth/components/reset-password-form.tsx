import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { InputRoot, InputIcon, InputField } from "@/components/ui/input"

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirmação deve ter pelo menos 8 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>

type ResetPasswordFormProps = {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps): React.ReactElement {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema)
  })

  async function handleResetPassword({ password }: ResetPasswordSchema) {
    setIsLoading(true)
    
    const { error } = await auth.resetPassword({
      newPassword: password,
      token,
    })

    if (error) {
      toast.error(error.message || "Erro ao redefinir senha")
      setIsLoading(false)
      return
    }

    toast.success("Senha redefinida com sucesso!")
    navigate({ to: "/sign-in" })
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">Nova senha</h1>
        <p className="text-sm text-muted-foreground">Insira sua nova senha</p>
      </div>

      <form onSubmit={handleSubmit(handleResetPassword)} className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-1">
          <InputRoot error={!!errors.password}>
            <InputIcon>
              <Lock className="size-5" />
            </InputIcon>
            <InputField
              type="password"
              placeholder="Nova senha"
              {...register("password")}
            />
          </InputRoot>
          {errors.password && (
            <span className="text-xs text-destructive pl-4">{errors.password.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <InputRoot error={!!errors.confirmPassword}>
            <InputIcon>
              <Lock className="size-5" />
            </InputIcon>
            <InputField
              type="password"
              placeholder="Confirmar nova senha"
              {...register("confirmPassword")}
            />
          </InputRoot>
          {errors.confirmPassword && (
            <span className="text-xs text-destructive pl-4">{errors.confirmPassword.message}</span>
          )}
        </div>

        <Button className="h-12 w-full" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-primary-foreground" />
          ) : (
            "Redefinir senha"
          )}
        </Button>
      </form>
    </div>
  )
}
