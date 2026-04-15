import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { useTheme } from "../theme-provider"


const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      swipeDirections={["right", "left"]}
      className="toaster group"
      position="bottom-center"
      icons={{
        success: (
          <CircleCheckIcon className="size-5" />
        ),
        info: (
          <InfoIcon className="size-5" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5" />
        ),
        error: (
          <OctagonXIcon className="size-5" />
        ),
        loading: (
          <Loader2Icon className="size-5 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "2rem",
          "--toast-icon-margin-start": "0px",
          "--toast-icon-margin-end": "12px",
          "--toast-svg-margin-start": "0px",
          "--toast-svg-margin-end": "0px",
          "--toast-button-margin-start": "auto",
          "--toast-button-margin-end": "0",
          "--toast-close-button-start": "0",
          "--toast-close-button-end": "0",
          "--toast-close-button-transform": "translate(-35%, -35%) absolute",
          "--offset": "5rem",
          "zIndex": 49,
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border/20 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-full transition-all duration-(--duration-base) ease-snappy flex items-center gap-3 px-5 py-3 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] max-w-2xl min-h-16 pointer-events-auto",
          description: "group-[.toast]:text-muted-foreground font-medium",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground btn-press rounded-xl px-3 transition-transform ease-snappy",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground btn-press rounded-xl px-3 transition-transform ease-snappy",
          title: "font-bold tracking-tight text-[15px]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
