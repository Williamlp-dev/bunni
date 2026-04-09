import { useState } from "react"
import { Dialog, DialogTrigger, DialogPopup } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type ImagePreviewProps = {
  src: string
  alt?: string
  className?: string
  variant?: "sent" | "received"
}

export function ImagePreview({ src, alt = "Imagem", className, variant }: ImagePreviewProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className={cn("flex items-center justify-center w-64 h-48 rounded-xl bg-muted/50 text-muted-foreground text-xs", className)}>
        Imagem indisponível
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          "relative block rounded-2xl overflow-hidden cursor-pointer",
          "transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]",
          className
        )}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        {!isLoaded && (
          <div className="w-64 h-48 rounded-2xl animate-pulse" />
        )}
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "max-w-[280px] max-h-[360px] w-auto h-auto rounded-2xl object-cover transition-all duration-300 ease-out",
            isLoaded ? "opacity-100" : "opacity-0 blur-sm absolute inset-0",
            variant === "sent" ? "border-2 border-primary" : "border border-black/10 dark:border-white/10"
          )}
        />
      </DialogTrigger>

      <DialogPopup className="max-w-[90vw] max-h-[90vh] w-auto p-0 overflow-hidden bg-background/90 border-border/20 flex items-center justify-center" showCloseButton bottomStickOnMobile={false}>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
        />
      </DialogPopup>
    </Dialog>
  )
}
