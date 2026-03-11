import {
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
  EmojiPicker as EmojiPickerPrimitive,
} from "frimousse";
import { LoaderIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function EmojiPicker({
  className,
  ...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Root>) {
  return (
    <EmojiPickerPrimitive.Root
      className={cn(
        "bg-background/95 border border-border/40 flex h-full w-full flex-col overflow-hidden rounded-xl",
        className
      )}
      data-slot="emoji-picker"
      {...props}
    />
  );
}

function EmojiPickerSearch({
  className,
  ...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Search>) {
  return (
    <div
      className={cn("flex h-12 items-center gap-2 px-3 border-b border-border/40 bg-secondary/10", className)}
      data-slot="emoji-picker-search-wrapper"
    >
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
      <EmojiPickerPrimitive.Search
        className="outline-hidden placeholder:text-muted-foreground/70 flex h-9 w-full rounded-lg bg-transparent py-2 text-sm text-foreground focus:bg-background/50"
        placeholder="Buscar emoji..."
        data-slot="emoji-picker-search"
        {...props}
      />
    </div>
  );
}

function EmojiPickerRow({ children, ...props }: EmojiPickerListRowProps) {
  return (
    <div {...props} className="grid grid-cols-[repeat(auto-fit,minmax(40px,1fr))] gap-1 px-3 py-1" data-slot="emoji-picker-row">
      {children}
    </div>
  );
}

function EmojiPickerEmoji({
  emoji,
  className,
  ...props
}: EmojiPickerListEmojiProps) {
  return (
    <button
      {...props}
      className={cn(
        "data-active:bg-primary/10 data-active:text-primary hover:bg-muted/60 flex h-10 w-full items-center justify-center rounded-lg text-2xl cursor-pointer select-none leading-none",
        "font-[\"Apple_Color_Emoji\",\"Segoe_UI_Emoji\",\"Segoe_UI_Symbol\",\"Noto_Color_Emoji\"] antialiased",
        className
      )}
      data-slot="emoji-picker-emoji"
    >
      {emoji.emoji}
    </button>
  );
}

function EmojiPickerCategoryHeader({
  category,
  ...props
}: EmojiPickerListCategoryHeaderProps) {
  return (
    <div
      {...props}
      className="sticky top-0 z-10 bg-background/95 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 border-b border-border/20"
      data-slot="emoji-picker-category-header"
    >
      {category.label}
    </div>
  );
}

function EmojiPickerContent({
  className,
  ...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Viewport>) {
  return (
    <EmojiPickerPrimitive.Viewport
      className={cn("outline-hidden relative flex-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40", className)}
      data-slot="emoji-picker-viewport"
      {...props}
    >
      <EmojiPickerPrimitive.Loading
        className="absolute inset-0 flex items-center justify-center text-muted-foreground"
        data-slot="emoji-picker-loading"
      >
        <LoaderIcon className="size-5 animate-spin text-primary" />
      </EmojiPickerPrimitive.Loading>
      <EmojiPickerPrimitive.Empty
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm"
        data-slot="emoji-picker-empty"
      >
        <span className="text-2xl">😕</span>
        <p>Nenhum emoji encontrado</p>
      </EmojiPickerPrimitive.Empty>
      <EmojiPickerPrimitive.List
        className="select-none py-2"
        components={{
          Row: EmojiPickerRow,
          Emoji: EmojiPickerEmoji,
          CategoryHeader: EmojiPickerCategoryHeader,
        }}
        data-slot="emoji-picker-list"
      />
    </EmojiPickerPrimitive.Viewport>
  );
}

export {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
};