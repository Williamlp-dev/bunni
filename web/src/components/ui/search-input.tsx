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
        "h-12 rounded-md bg-muted hover:bg-accent focus-within:bg-background",
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
