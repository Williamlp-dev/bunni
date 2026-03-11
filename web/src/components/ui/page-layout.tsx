import { cn } from "@/lib/utils"

type PageLayoutProps = {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps): React.ReactElement {
  return (
    <main className="flex flex-1 flex-col h-full overflow-hidden bg-background w-full">
      <div className="flex-1 overflow-y-auto">
        <div className={cn("max-w-2xl mx-auto px-6 py-8 md:px-10 md:py-12 space-y-8", className)}>
          {children}
        </div>
      </div>
    </main>
  )
}
