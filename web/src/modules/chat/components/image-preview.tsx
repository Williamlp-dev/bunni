import { useState } from "react"
import { ZoomIn } from "lucide-react"
import { Dialog, DialogTrigger, DialogPopup } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type ImagePreviewProps = {
  src: string
  alt?: string
  className?: string
  variant?: "sent" | "received"
}

export function ImagePreview({ src, alt = "Imagem", className, variant = "received" }: ImagePreviewProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className={cn("flex items-center justify-center w-48 h-32 rounded-xl bg-muted text-muted-foreground text-xs", className)}>
        Imagem indisponível
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger
        className={cn("relative block rounded-xl overflow-hidden cursor-zoom-in group/img", className)}
      >
        {!isLoaded && (
          <div className="w-48 h-36 rounded-xl bg-muted animate-pulse" />
        )}
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "max-w-[240px] max-h-[320px] w-auto h-auto rounded-xl object-cover transition-opacity duration-200",
            isLoaded ? "opacity-100" : "opacity-0 absolute inset-0",
            variant === "sent" ? "border border-primary-foreground/20" : "border border-border/40"
          )}
        />
        {isLoaded && (
          <div className="absolute inset-0 bg-transparent group-hover/img:bg-foreground/20 transition-colors duration-150 flex items-center justify-center rounded-xl">
            <ZoomIn className="text-secondary opacity-0 group-hover/img:opacity-100 transition-opacity duration-150 size-6 drop-shadow" />
          </div>
        )}
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
