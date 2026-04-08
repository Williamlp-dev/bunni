import { useEffect, useState } from "react"
import { Logo } from "@/components/ui/logo"

export function SplashScreen() {
  const [isWakingServer, setIsWakingServer] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWakingServer(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-max flex flex-col items-center justify-center bg-background">

      <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">

        <Logo
          size="lg"
          textOnly
          className="text-primary mb-10"
        />

        <div className="w-56 h-[3px] bg-border/60 rounded-full overflow-hidden mb-6 relative">
          <div className="absolute inset-y-0 left-0 w-full bg-primary/80 animate-navigation-progress origin-left rounded-full" />
        </div>

        {/* Status Text Box with larger typography */}
        <div className="h-8 flex items-center justify-center text-center">
          <p
            key={isWakingServer ? "waking" : "connecting"}
            className="text-base font-medium text-muted-foreground animate-in slide-in-from-bottom-2 fade-in duration-500 max-w-[85vw]"
          >
            {isWakingServer
              ? "Acordando o servidor (Render Free), aguarde até 50s..."
              : "Conectando ao bunni..."}
          </p>
        </div>

      </div>
    </div>
  )
}
