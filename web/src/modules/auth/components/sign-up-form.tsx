import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, User, Mail, Lock, AtSign } from "lucide-react"
import { toast } from "sonner"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { InputRoot, InputIcon, InputField } from "@/components/ui/input"
import { queryClient } from "@/lib/query-client"

const signUpSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  username: z.string()
    .min(3, "Mínimo 3 caracteres")
    .max(15, "Máximo 15 caracteres")
    .regex(/^[a-z0-9_]+$/, "Apenas letras minúsculas, números e _"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
})

type SignUpSchema = z.infer<typeof signUpSchema>

export function SignUp(): React.ReactElement {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema)
  })

  async function handleSignUp({ name, username, email, password }: SignUpSchema) {
    setIsLoading(true)
    
    const { error } = await auth.signUp.email({
      name,
      username,
      email,
      password,
    })

    if (error) {
      toast.error(error.message || "Não foi possível criar sua conta")
      setIsLoading(false)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ["auth-session"] })
    navigate({ to: "/chat" })
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">Criar conta</h1>
        <p className="text-sm text-muted-foreground">Preencha seus dados para começar</p>
      </div>

      <form onSubmit={handleSubmit(handleSignUp)} className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-1">
          <InputRoot error={!!errors.name}>
            <InputIcon>
              <User className="size-5" />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Nome completo"
              autoComplete="name"
              {...register("name")}
            />
          </InputRoot>
          {errors.name && (
            <span className="text-xs text-destructive pl-4">{errors.name.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <InputRoot error={!!errors.username}>
            <InputIcon>
              <AtSign className="size-5" />
            </InputIcon>
            <InputField
              type="text"
              placeholder="Usuário (ex: joaosilva)"
              autoComplete="nickname"
              {...register("username")}
            />
          </InputRoot>
          {errors.username && (
            <span className="text-xs text-destructive pl-4">{errors.username.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <InputRoot error={!!errors.email}>
            <InputIcon>
              <Mail className="size-5" />
            </InputIcon>
            <InputField
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...register("email")}
            />
          </InputRoot>
          {errors.email && (
            <span className="text-xs text-destructive pl-4">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <InputRoot error={!!errors.password}>
            <InputIcon>
              <Lock className="size-5" />
            </InputIcon>
            <InputField
              type="password"
              placeholder="Senha"
              autoComplete="new-password"
              {...register("password")}
            />
          </InputRoot>
          {errors.password && (
            <span className="text-xs text-destructive pl-4">{errors.password.message}</span>
          )}
        </div>

        <Button className="w-full rounded-none" size="lg" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-primary-foreground" />
          ) : (
            "Cadastrar"
          )}
        </Button>
      </form>
    </div>
  )
}
