import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail, Lock } from "lucide-react"
import { toast } from "sonner"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { InputRoot, InputIcon, InputField } from "@/components/ui/input"
import { Link } from "@tanstack/react-router"
import { queryClient } from "@/lib/query-client"

const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
})

type SignInSchema = z.infer<typeof signInSchema>

export function SignIn(): React.ReactElement {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema)
  })

  async function handleSignIn({ email, password }: SignInSchema) {
    setIsLoading(true)
    
    const { error } = await auth.signIn.email({
      email,
      password,
    })

    if (error) {
      toast.error(error.message || "Credenciais inválidas")
      setIsLoading(false)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ["auth-session"] })
    navigate({ to: "/chat" })
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
        <p className="text-sm text-muted-foreground">Faça login para continuar</p>
      </div>

      <form onSubmit={handleSubmit(handleSignIn)} className="flex w-full flex-col gap-4">
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

        <div className="flex flex-col gap-1">
          <InputRoot error={!!errors.password}>
            <InputIcon>
              <Lock className="size-5" />
            </InputIcon>
            <InputField
              type="password"
              placeholder="Senha"
              {...register("password")}
            />
          </InputRoot>
          {errors.password && (
            <span className="text-xs text-destructive pl-4">{errors.password.message}</span>
          )}
          <Link
            to="/forgot-password"
            className="text-xs text-primary hover:text-primary-foreground transition-colors underline decoration-2 underline-offset-4 font-bold"
          >
            Esqueceu sua senha?
          </Link>
        </div>

        <Button className="w-full rounded-none" size="lg" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-primary-foreground" />
          ) : (
            "Entrar"
          )}
        </Button>
      </form>
    </div>
  )
}
