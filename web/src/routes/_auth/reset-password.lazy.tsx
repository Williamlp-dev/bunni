import { Logo } from '@/components/ui/logo'
import { ResetPasswordForm } from '@/modules/auth/components/reset-password-form'
import { createLazyFileRoute, Link } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_auth/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token, error: tokenError } = Route.useSearch()

  const hasInvalidToken = tokenError === 'INVALID_TOKEN'

  return (
    <div className="min-h-screen grid lg:grid-cols-2 selection:bg-foreground selection:text-background">
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground selection:bg-background selection:text-primary relative overflow-hidden">
        <div className="z-10">
          <Logo size="md" variant="contrast" />
        </div>

        <div className="z-10 space-y-2">
          <h1 className="text-9xl leading-none font-black tracking-tighter uppercase opacity-90">
            No<br />va<br />senha
          </h1>
        </div>

        <div className="z-10 text-sm font-medium opacity-80 uppercase tracking-widest">
          © 2026 Bunni Inc.
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 lg:p-20 bg-background text-foreground">
        <div className="w-full max-w-sm space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {hasInvalidToken ? (
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">Link inválido ou expirado</h1>
              <p className="text-sm text-muted-foreground text-center">
                O link de redefinição de senha é inválido ou já expirou. Solicite um novo link.
              </p>
              <Link
                to="/forgot-password"
                className="text-foreground hover:text-primary transition-colors underline decoration-2 underline-offset-4 font-bold"
              >
                Solicitar novo link
              </Link>
            </div>
          ) : !token ? (
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">Token não encontrado</h1>
              <p className="text-sm text-muted-foreground text-center">
                Nenhum token de redefinição foi encontrado. Use o link enviado para o seu email.
              </p>
              <Link
                to="/forgot-password"
                className="text-foreground hover:text-primary transition-colors underline decoration-2 underline-offset-4 font-bold"
              >
                Solicitar novo link
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center lg:hidden">
                <Logo size="sm" variant="contrast" />
              </div>

              <ResetPasswordForm token={token} />

              <p className="text-center text-sm font-medium text-muted-foreground">
                LEMBRO MINHA SENHA?{' '}
                <Link
                  to="/sign-in"
                  className="text-foreground hover:text-primary transition-colors underline decoration-2 underline-offset-4 font-bold"
                >
                  FAÇA LOGIN
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
