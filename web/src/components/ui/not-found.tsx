import { Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Footer } from "@/components/ui/footer"

export function NotFoundPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden selection:bg-foreground selection:text-background flex flex-col">
      <header className="fixed top-0 z-50 w-full p-6 md:p-10 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <Logo size="sm" variant="contrast" />
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 md:px-10 pt-20">
        <div className="max-w-360 mx-auto w-full">
          <div className="space-y-0 animate-in slide-in-from-bottom duration-1000 fade-in flex flex-col items-start uppercase tracking-tighter leading-[0.85]">
            <h1 className="text-[clamp(4rem,14vw,16rem)] font-black text-foreground">
              Erro
            </h1>
            <h1 className="text-[clamp(4rem,14vw,16rem)] font-black text-primary">
              404
            </h1>
          </div>

          <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 max-w-360 mx-auto animate-in slide-in-from-bottom duration-1000 delay-300 fade-in">
            <p className="text-xl md:text-2xl font-medium max-w-md leading-tight text-muted-foreground">
              A página que você procura não existe. Talvez tenha sido movida ou excluída.
            </p>

            <Link
              to="/"
              className="group flex items-center gap-3 text-2xl md:text-4xl font-bold hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-8 h-8 md:w-12 md:h-12 transition-transform group-hover:-translate-x-4" />
              <span>Voltar</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
