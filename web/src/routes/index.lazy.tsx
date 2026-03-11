import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Footer } from '@/components/ui/footer'

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden selection:bg-foreground selection:text-background flex flex-col">
      <header className="fixed top-0 w-full p-6 md:p-10 flex justify-between items-start pointer-events-none" style={{ zIndex: "var(--z-sticky)" }}>
        <div className="pointer-events-auto">
          <Logo size="sm" variant="contrast" />
        </div>
        <nav className="flex items-center gap-6 pointer-events-auto">
          <Link
            to="/sign-in"
            className="text-sm font-medium hover:text-primary transition-colors hover:underline decoration-2 underline-offset-4"
          >
            LOGIN
          </Link>
          <Link
            to="/sign-up"
            className="text-sm font-medium bg-foreground text-background px-6 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            CREATE ACCOUNT
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 md:px-10 pt-20">
        <div className="max-w-360 mx-auto w-full">
          <div className="animate-in slide-in-from-bottom duration-1000 fade-in flex flex-col items-start uppercase tracking-tighter leading-none">
            <h1 className="text-7xl md:text-9xl font-black text-foreground">
              Mensagens
            </h1>
            <h1 className="text-7xl md:text-9xl font-black text-primary">
              Sem Ruído
            </h1>
          </div>

          <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 max-w-360 mx-auto animate-in slide-in-from-bottom duration-1000 delay-300 fade-in">
            <p className="text-xl md:text-2xl font-medium max-w-md leading-tight text-muted-foreground">
              Comunicação direta para quem valoriza velocidade e privacidade. Sem distrações.
            </p>

            <Link
              to="/sign-up"
              className="group flex items-center gap-3 text-2xl md:text-4xl font-bold hover:text-primary transition-colors"
            >
              <span>Começar agora</span>
              <ArrowRight className="w-8 h-8 md:w-12 md:h-12 transition-transform group-hover:translate-x-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
