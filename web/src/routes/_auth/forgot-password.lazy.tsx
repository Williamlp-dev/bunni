import { Logo } from '@/components/ui/logo'
import { ForgotPasswordForm } from '@/modules/auth/components/forgot-password-form'
import { createLazyFileRoute, Link } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 selection:bg-foreground selection:text-background">
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground selection:bg-background selection:text-primary relative overflow-hidden">
        <div className="z-10">
          <Logo size="md" variant="contrast" />
        </div>

        <div className="z-10 space-y-2">
          <h1 className="text-9xl leading-none font-black tracking-tighter uppercase opacity-90">
            Es<br />que<br />ceu
          </h1>
        </div>

        <div className="z-10 text-sm font-medium opacity-80 uppercase tracking-widest">
          © 2026 Bunni Inc.
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 lg:p-20 bg-background text-foreground">
        <div className="w-full max-w-sm space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center lg:hidden">
            <Logo size="sm" variant="contrast" />
          </div>

          <ForgotPasswordForm />

          <p className="text-center text-sm font-medium text-muted-foreground">
            LEMBRO MINHA SENHA?{' '}
            <Link
              to="/sign-in"
              className="text-foreground hover:text-primary transition-colors underline decoration-2 underline-offset-4 font-bold"
            >
              FAÇA LOGIN
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
