
import { useState, useRef, lazy, Suspense, type FormEvent, type KeyboardEvent, type ChangeEvent } from "react"
import { CirclePlus, Smile, Send, X, MessageSquareReply, Loader, Image } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InputRoot, InputField } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Message } from "@/lib/eden-types"
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@/components/ui/menu"

const LazyEmojiPicker = lazy(() => import("./emoji-picker").then(m => ({ default: m.EmojiPicker })))
const LazyEmojiPickerContent = lazy(() => import("./emoji-picker").then(m => ({ default: m.EmojiPickerContent })))
const LazyEmojiPickerSearch = lazy(() => import("./emoji-picker").then(m => ({ default: m.EmojiPickerSearch })))

const LazyAudioRecorderProvider = lazy(() => import("./audio-recorder").then(m => ({ default: m.AudioRecorderProvider })))
const LazyAudioRecorderOverlay = lazy(() => import("./audio-recorder").then(m => ({ default: m.AudioRecorderOverlay })))
const LazyAudioRecorderTrigger = lazy(() => import("./audio-recorder").then(m => ({ default: m.AudioRecorderTrigger })))

type ChatInputProps = {
  onSend: (content: string) => void
  onSendAudio?: (blob: Blob, duration: number) => void
  onSendImage?: (file: File) => void
  onTyping: () => void
  disabled?: boolean
  isSendingAudio?: boolean
  className?: string
  replyingTo?: Message | null
  onCancelReply?: () => void
}

export function ChatInput({ onSend, onSendAudio, onSendImage, onTyping, disabled, isSendingAudio, className, replyingTo, onCancelReply }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    onTyping()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSend(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const replyingSenderName = replyingTo?.sender.name ?? replyingTo?.sender.displayUsername

  return (
    <div className="flex flex-col bg-background/90 border-t border-border/50">
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          replyingTo ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-accent/50 border-b border-border/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <MessageSquareReply className="size-4 text-primary shrink-0" />
              </div>
              <div className="flex flex-col text-sm overflow-hidden">
                <span className="font-semibold text-foreground text-xs truncate tracking-tight">
                  Respondendo a {replyingSenderName}
                </span>
                <span className="text-muted-foreground truncate text-xs font-normal">
                  {replyingTo?.content}
                </span>
              </div>
            </div>
            <Button
              onClick={onCancelReply}
              variant="ghost"
              size="icon"
              className="hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground active:scale-95 transition-transform duration-150 ease-out"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="h-20" />}>
        <LazyAudioRecorderProvider onSend={onSendAudio}>
          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex items-center gap-4 px-5 py-2 h-20",
              className
            )}
          >
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onSendImage?.(file)
                  e.target.value = ""
                }}
              />
              <Menu>
                <MenuTrigger render={
                  <Button
                    type="button"
                    aria-label="Add attachment"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg shrink-0"
                  >
                    <CirclePlus className="size-5" />
                  </Button>
                } />
                <MenuPopup>
                  <MenuItem onClick={() => fileInputRef.current?.click()}>
                    <Image className="size-4" />
                    Imagem
                  </MenuItem>
                </MenuPopup>
              </Menu>

              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger render={
                  <Button
                    type="button"
                    aria-label="Add emoji"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className={cn(
                      "text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg shrink-0",
                      showEmojiPicker && "text-primary bg-secondary/60"
                    )}
                  >
                    <Smile className="size-5" />
                  </Button>
                } />
                <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent" side="top" align="start">
                  <Suspense fallback={
                    <div className="h-80 w-80 sm:w-96 md:h-96 md:w-96 bg-background/90 rounded-xl border border-border/50 flex items-center justify-center">
                      <Loader className="size-6 animate-spin text-primary" />
                    </div>
                  }>
                    <LazyEmojiPicker
                      className="h-80 w-80 sm:w-96 md:h-96 md:w-96"
                      onEmojiSelect={(emoji: any) => {
                        setMessage((prev) => prev + emoji.emoji)
                      }}
                    >
                      <LazyEmojiPickerSearch />
                      <LazyEmojiPickerContent />
                    </LazyEmojiPicker>
                  </Suspense>
                </PopoverContent>
              </Popover>
            </div>

            <div className="relative flex-1">
              <InputRoot className="relative">
                <div className="pointer-events-none absolute inset-0 flex items-center px-4 overflow-hidden">
                  <span
                    className={cn(
                      "absolute whitespace-nowrap text-muted-foreground transition-all duration-300 ease-out",
                      message ? "opacity-0 translate-y-0" : replyingTo ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0",
                    )}
                  >
                    Digite uma mensagem...
                  </span>
                  <span
                    className={cn(
                      "absolute whitespace-nowrap text-muted-foreground transition-all duration-300 ease-out",
                      message ? "opacity-0 translate-y-0" : replyingTo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                    )}
                  >
                    Escreva sua resposta...
                  </span>
                </div>
                <InputField
                  value={message}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder=""
                  disabled={disabled}
                  autoFocus={!!replyingTo}
                  className="text-sm z-10"
                />
              </InputRoot>
              <LazyAudioRecorderOverlay hideSendButton />
            </div>

            <div className="relative flex items-center justify-center size-8 shrink-0">
              <Button
                type="submit"
                aria-label="Send message"
                variant="ghost"
                size="icon"
                disabled={!message.trim() || disabled}
                className={cn(
                  "absolute inset-0 z-10 rounded-lg transition-all duration-200 ease-out active:scale-95",
                  message.trim()
                    ? "opacity-100 scale-100 blur-0 text-primary hover:text-primary-foreground hover:bg-primary animate-send-pop"
                    : "opacity-0 scale-50 blur-sm pointer-events-none"
                )}
              >
                <Send className="size-5" />
              </Button>

              <div
                className={cn(
                  "absolute inset-0 z-0 transition-all duration-200 ease-out",
                  !message.trim()
                    ? "opacity-100 scale-100 blur-0"
                    : "opacity-0 scale-50 blur-sm pointer-events-none"
                )}
              >
                <LazyAudioRecorderTrigger
                  disabled={disabled || isSendingAudio}
                  onSubmitBehavior="send"
                  className="size-8"
                />
              </div>
            </div>
          </form>
        </LazyAudioRecorderProvider>
      </Suspense>
    </div>
  )
}
