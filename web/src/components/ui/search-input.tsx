import type { ComponentProps } from "react"
import { Search } from "lucide-react"
import { InputRoot, InputField, InputIcon } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type SearchInputProps = ComponentProps<"input"> & {
  onSearch?: (value: string) => void
}

export function SearchInput({ onSearch, onChange, className, ...props }: SearchInputProps): React.ReactElement {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange?.(e)
    onSearch?.(e.target.value)
  }

  return (
    <InputRoot
      className={cn(
        "h-10 rounded-full border-transparent bg-muted hover:bg-muted/80 focus-within:bg-background focus-within:border-input",
        className
      )}
    >
      <InputIcon>
        <Search className="size-4" />
      </InputIcon>
      <InputField
        type="text"
        onChange={handleChange}
        {...props}
      />
    </InputRoot>
  )
}
