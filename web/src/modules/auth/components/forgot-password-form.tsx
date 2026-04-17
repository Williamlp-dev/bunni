import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { InputRoot, InputIcon, InputField } from "@/components/ui/input"

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
})

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm(): React.ReactElement {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  async function handleForgotPassword({ email }: ForgotPasswordSchema) {
    setIsLoading(true)
    
    const { error } = await auth.requestPasswordReset({
      email,
      redirectTo: `${import.meta.env.VITE_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      toast.error(error.message || "Erro ao enviar email de recuperação")
      setIsLoading(false)
      return
    }

    toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.")
    navigate({ to: "/sign-in" })
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">Esqueceu sua senha?</h1>
        <p className="text-sm text-muted-foreground">Insira o seu email para recuperação</p>
      </div>

      <form onSubmit={handleSubmit(handleForgotPassword)} className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-1">
          <InputRoot error={!!errors.email}>
            <InputIcon>
              <Mail className="size-5" />
            </InputIcon>
            <InputField
              type="email"
              placeholder="Email"
              {...register("email")}
            />
          </InputRoot>
          {errors.email && (
            <span className="text-xs text-destructive pl-4">{errors.email.message}</span>
          )}
        </div>

        <Button className="w-full rounded-none" size="lg" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-primary-foreground" />
          ) : (
            "Enviar link de recuperação"
          )}
        </Button>
      </form>
    </div>
  )
}
