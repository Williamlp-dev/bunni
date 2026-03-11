import * as React from "react"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type CardProps = ComponentProps<"div"> & {
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hover = true, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-background border border-border rounded-2xl p-6",
        hover && "hover:border-primary cursor-pointer",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

type CardHeaderProps = ComponentProps<"div">

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 pb-4", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

type CardTitleProps = ComponentProps<"h3">

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-bold text-foreground", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

type CardDescriptionProps = ComponentProps<"p">

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-muted-foreground", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

type CardContentProps = ComponentProps<"div">

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("", className)}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"

type CardFooterProps = ComponentProps<"div">

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-4 pt-4", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}
