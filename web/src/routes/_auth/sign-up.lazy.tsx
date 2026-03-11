import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { SignUp } from "@/modules/auth/components/sign-up-form"
import { Logo } from "@/components/ui/logo"
import { useSession } from "@/modules/auth/hooks/use-session"
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export const Route = createLazyFileRoute('/_auth/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  const { isAuthenticated, isPending } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isPending && isAuthenticated) {
      navigate({ to: '/chat' })
    }
  }, [isAuthenticated, isPending, navigate])

  return (
    <div className="min-h-screen grid lg:grid-cols-2 selection:bg-foreground selection:text-background">
      <div className="hidden lg:flex flex-col justify-between bg-foreground p-10 text-background selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
        <div className="z-10">
          <div className="text-background">
            <Logo size="md" variant="contrast" />
          </div>
        </div>

        <div className="z-10 space-y-2">
          <h1 className="text-9xl leading-none font-black tracking-tighter uppercase">
            Nova<br />Conta
          </h1>
        </div>

        <div className="z-10 text-sm font-medium opacity-80 uppercase tracking-widest">
          © 2026 Bunni Inc.
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 lg:p-20 bg-background text-foreground">
        <div className="w-full max-w-sm space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isPending ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Iniciando...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center lg:hidden">
                <Logo size="sm" variant="contrast" />
              </div>

              <SignUp />

              <div className="space-y-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  JÁ TEM CONTA?{' '}
                  <Link
                    to="/sign-in"
                    className="text-foreground hover:text-primary transition-colors underline decoration-2 underline-offset-4 font-bold"
                  >
                    ENTRAR
                  </Link>
                </p>

                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Ao criar conta, você concorda com nossos <span className="underline cursor-pointer hover:text-foreground">Termos de Uso</span> e <span className="underline cursor-pointer hover:text-foreground">Privacidade</span>.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
