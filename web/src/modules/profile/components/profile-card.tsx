import { cn } from "@/lib/utils"
import { BadgeCheck } from "lucide-react"

type ProfileCardProps = {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function ProfileCard({ children, className, hover = false }: ProfileCardProps) {
  return (
    <div
      className={cn(
        "border-2 border-border bg-card p-6 transition-all duration-300 rounded-xl",
        hover && "hover:border-primary hover:shadow-md hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  )
}

type ProfileSectionProps = {
  title: string
  children: React.ReactNode
  className?: string
}

export function ProfileSection({ title, children, className }: ProfileSectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
          {title}
        </h2>
        <div className="flex-1 h-0.5 bg-border" />
      </div>
      {children}
    </div>
  )
}

type ProfileFieldProps = {
  label: string
  value: string | React.ReactNode
  icon?: React.ReactNode
  verified?: boolean
}

export function ProfileField({ label, value, icon, verified }: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-4 group">
      {icon && (
        <div className="mt-1 text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
      )}
      <div className="flex-1 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-foreground">{value}</p>
          {verified && (
            <BadgeCheck className="size-5 text-primary" />
          )}
        </div>
      </div>
    </div>
  )
}
