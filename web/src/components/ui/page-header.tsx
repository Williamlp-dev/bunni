import { ChevronLeft, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"

export type PageHeaderProps = {
  variant?: "default" | "inline"
  title: string
  description?: string
  eyebrow?: string
  backTo?: string
  backLabel?: string
  onBack?: () => void
  onTitleClick?: () => void
  actions?: React.ReactNode
  startContent?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function PageHeader({
  variant = "default",
  title,
  description,
  eyebrow,
  backTo,
  backLabel = "Voltar",
  onBack,
  onTitleClick,
  actions,
  startContent,
  className,
  children,
}: PageHeaderProps): React.ReactElement {
  if (variant === "inline") {
    return (
      <div className={cn("space-y-6", className)}>
        {(backTo || onBack) && (
          backTo ? (
            <Link
              to={backTo}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 px-3 gap-1.5 w-fit text-sm text-muted-foreground hover:text-foreground -ml-1"
              )}
            >
              <ArrowLeft className="size-4" />
              {backLabel}
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 px-3 gap-1.5 w-fit text-sm text-muted-foreground hover:text-foreground -ml-1"
            >
              <ArrowLeft className="size-4" />
              {backLabel}
            </Button>
          )
        )}
        <div className="space-y-1.5">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    )
  }

  return (
    <header
      className={cn(
        "flex min-h-16 w-full items-center justify-between gap-4 border-b border-border bg-background px-6 backdrop-blur-sm shrink-0",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {startContent}
        {backTo && !startContent && (
          <Link
            to={backTo}
            aria-label={backLabel}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <ChevronLeft className="size-5" />
          </Link>
        )}
        {onBack && !startContent && !backTo && (
          <Button onClick={onBack} aria-label={backLabel} variant="ghost" size="icon">
            <ChevronLeft className="size-5" />
          </Button>
        )}
        <div 
          className={cn(
            "flex flex-col min-w-0 py-2", 
            onTitleClick && "cursor-pointer hover:opacity-80 transition-opacity"
          )}
          onClick={onTitleClick}
          role={onTitleClick ? "button" : undefined}
          tabIndex={onTitleClick ? 0 : undefined}
          onKeyDown={(e) => {
            if (onTitleClick && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault()
              onTitleClick()
            }
          }}
        >
          {eyebrow && <span className="text-[10px] font-semibold uppercase tracking-widest text-primary leading-none mb-1">{eyebrow}</span>}
          <h1 className="min-w-0 truncate text-base font-bold tracking-tight text-foreground md:text-lg">
            {title}
          </h1>
          {description && <span className="text-xs text-muted-foreground truncate">{description}</span>}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
      {children}
    </header>
  )
}
