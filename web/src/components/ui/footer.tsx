export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border p-6 animate-in fade-in md:p-10">
      <div className="grid grid-cols-1 gap-4 text-sm font-medium uppercase tracking-wide text-muted-foreground md:grid-cols-4">
        <div>© 2026 Bunni Inc.</div>
        <div>0ms Latência</div>
        <div>100% Criptografado</div>
        <div className="flex gap-6 md:justify-end">
          <a href="#" className="transition-colors hover:text-foreground">Github</a>
          <a href="#" className="transition-colors hover:text-foreground">Termos</a>
        </div>
      </div>
    </footer>
  )
}
