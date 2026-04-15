import * as React from "react"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type InputRootProps = ComponentProps<"div"> & {
  error?: boolean
}

const InputRoot = React.forwardRef<HTMLDivElement, InputRootProps>(
  ({ error = false, className, ...props }, ref) => (
    <div
      ref={ref}
      data-error={error}
      className={cn(
        "group flex h-14 items-center gap-4 rounded-xl border border-input bg-background px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring data-[error=true]:border-destructive",
        className
      )}
      {...props}
    />
  )
)
InputRoot.displayName = "InputRoot"

type InputIconProps = ComponentProps<"span">

const InputIcon = React.forwardRef<HTMLSpanElement, InputIconProps>(
  (props, ref) => (
    <span
      ref={ref}
      className="text-muted-foreground group-focus-within:text-primary group-data-[error=true]:text-destructive"
      {...props}
    />
  )
)
InputIcon.displayName = "InputIcon"

type InputFieldProps = ComponentProps<"input">

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "size-full flex-1 bg-transparent font-medium text-foreground outline-none placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
)
InputField.displayName = "InputField"

export {
  InputRoot,
  InputIcon,
  InputField,
}
