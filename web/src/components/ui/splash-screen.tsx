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
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="animate-pulse">
        <Logo className="w-24 h-24 mb-6" />
      </div>

      <div className="h-8 overflow-hidden flex items-center justify-center text-center">
        <p className="text-sm text-muted-foreground animate-in fade-in duration-500 max-w-[80vw]">
          {isWakingServer
            ? "Acordando o servidor (Render Free), isso pode levar até 50s..."
            : "Conectando ao bunni..."}
        </p>
      </div>
    </div>
  )
}
