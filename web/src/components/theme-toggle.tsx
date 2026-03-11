import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors btn-press border border-border/50 shadow-sm"
      onClick={toggleTheme}
      aria-label="Alternar tema"
    >
      <div className="relative flex size-5 items-center justify-center">
        <Sun className="absolute size-5 transition-transform duration-300 ease-out dark:-rotate-90 dark:scale-0 m-0!" />
        <Moon className="absolute size-5 rotate-90 scale-0 transition-transform duration-300 ease-out dark:rotate-0 dark:scale-100 m-0!" />
      </div>
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
