import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const Message = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex w-full gap-2", className)}
    {...props}
  />
))
Message.displayName = "Message"

const MessageAvatar = React.forwardRef<
  React.ElementRef<typeof Avatar>,
  React.ComponentPropsWithoutRef<typeof Avatar> & {
    src?: string
    fallback?: string
  }
>(({ className, src, fallback, ...props }, ref) => (
  <Avatar ref={ref} className={cn("size-8 shrink-0", className)} {...props}>
    <AvatarImage src={src} />
    <AvatarFallback>{fallback}</AvatarFallback>
  </Avatar>
))
MessageAvatar.displayName = "MessageAvatar"

const MessageContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg px-4 py-2 text-sm whitespace-pre-wrap wrap-break-word",
      className
    )}
    {...props}
  />
))
MessageContent.displayName = "MessageContent"

export { Message, MessageAvatar, MessageContent }
