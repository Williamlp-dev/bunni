import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type SkeletonProps = ComponentProps<"div">

export function Skeleton({ className, ...props }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn("animate-pulse bg-muted rounded-md", className)}
      {...props}
    />
  )
}
