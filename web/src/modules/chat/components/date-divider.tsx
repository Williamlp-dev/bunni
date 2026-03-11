type DateDividerProps = {
  date: string
}

export function DateDivider({ date }: DateDividerProps): React.ReactElement {
  return (
    <div className="relative flex items-center justify-center py-4 select-none">
      <div className="absolute inset-0 flex items-center px-4">
        <div className="w-full border-t border-border/50" />
      </div>
      <div className="relative px-3 py-1 bg-background rounded-full">
        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/60">
          {date}
        </span>
      </div>
    </div>
  )
}
