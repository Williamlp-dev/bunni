import { useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Play, Pause, Loader2, MicOff } from "lucide-react"
import { useAudioPlayer } from "../hooks/use-audio-player"

type AudioPlayerProps = {
  src: string
  duration?: number | null
  variant?: "sent" | "received"
  className?: string
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function AudioProgressBar({
  audioRef,
  duration,
  isPlaying,
  isSent,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>
  duration: number
  isPlaying: boolean
  isSent: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRatioRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const timeTextRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number>(0)
  const isDraggingRef = useRef(false)

  const updateUI = useCallback(
    (currentTime: number) => {
      const ratio = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0

      if (progressRatioRef.current) {
        progressRatioRef.current.style.width = `${ratio * 100}%`
      }

      if (thumbRef.current) {
        thumbRef.current.style.left = `${ratio * 100}%`
        thumbRef.current.style.opacity =
          isPlaying || currentTime > 0 ? "1" : "0"
      }

      if (timeTextRef.current) {
        const formattedCurrent = formatTime(currentTime)
        const formattedDuration = formatTime(duration)
        timeTextRef.current.textContent =
          currentTime > 0 || isPlaying
            ? `${formattedCurrent} / ${formattedDuration}`
            : formattedDuration
      }
    },
    [duration, isPlaying]
  )

  const tick = useCallback(() => {
    const audio = audioRef.current
    if (!audio || isDraggingRef.current) return

    updateUI(audio.currentTime)
    rafRef.current = requestAnimationFrame(tick)
  }, [audioRef, updateUI])

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
      // Ensure one last UI update when paused
      if (audioRef.current && !isDraggingRef.current) {
        updateUI(audioRef.current.currentTime)
      }
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, tick, updateUI, audioRef])

  // Subscribe to timeupdate for edge cases (e.g. seeking or ended)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      if (!isPlaying && !isDraggingRef.current) {
        updateUI(audio.currentTime)
      }
    }
    const handleSeeked = () => {
      if (!isDraggingRef.current) updateUI(audio.currentTime)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("seeked", handleSeeked)
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("seeked", handleSeeked)
    }
  }, [audioRef, isPlaying, updateUI])

  // Initial render setup
  useEffect(() => {
    if (audioRef.current && !isPlaying && !isDraggingRef.current) {
      updateUI(audioRef.current.currentTime)
    } else {
      updateUI(0)
    }
  }, [audioRef, isPlaying, updateUI])

  const getPositionFromEvent = (
    e: React.PointerEvent | PointerEvent
  ): number => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    return ratio * (duration || 0)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const track = trackRef.current
    if (!track || !duration) return

    isDraggingRef.current = true
    track.setPointerCapture(e.pointerId)

    const newTime = getPositionFromEvent(e)
    updateUI(newTime)

    const onMove = (ev: PointerEvent) => {
      const t = getPositionFromEvent(ev)
      updateUI(t)
    }

    const onUp = (ev: PointerEvent) => {
      isDraggingRef.current = false
      const t = getPositionFromEvent(ev)
      if (audioRef.current) audioRef.current.currentTime = t
      updateUI(t)
      track.removeEventListener("pointermove", onMove)
      track.removeEventListener("pointerup", onUp)
    }

    track.addEventListener("pointermove", onMove)
    track.addEventListener("pointerup", onUp)
  }

  return (
    <div className="flex-1 flex flex-col gap-2 w-48 shrink-0">
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative w-full cursor-pointer touch-none py-2 -my-2"
        aria-label="Progresso do áudio"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration}
      >
        <div
          className={cn(
            "relative h-2 w-full rounded-full overflow-hidden",
            isSent ? "bg-primary-foreground/20" : "bg-primary/20",
          )}
        >
          <div
            ref={progressRatioRef}
            className={cn(
              "absolute inset-y-0 left-0 transition-none will-change-transform",
              isSent ? "bg-primary-foreground/90" : "bg-primary"
            )}
            style={{
              width: "0%",
            }}
          />
        </div>
        <div
          ref={thumbRef}
          className={cn(
            "absolute size-3 rounded-full shadow-sm transition-none will-change-transform pointer-events-none",
            isSent ? "bg-primary-foreground" : "bg-primary"
          )}
          style={{
            top: "50%",
            left: "0%",
            transform: "translate(-50%, -50%)",
            opacity: 0,
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          ref={timeTextRef}
          className={cn(
            "text-xs font-mono tabular-nums leading-none",
            isSent ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}

export function AudioPlayer({
  src,
  duration: initialDuration,
  variant = "received",
  className,
}: AudioPlayerProps): React.JSX.Element {
  const isSent = variant === "sent"

  const { audioRef, duration, hasError, isLoading, isPlaying, togglePlay } =
    useAudioPlayer({ src, initialDuration })

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 py-1 px-1 opacity-50",
          className
        )}
      >
        <MicOff className="size-4 shrink-0" />
        <span className="text-xs">Áudio indisponível</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3 py-0.5", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0 size-8 rounded-full transition-transform active:scale-95",
          isSent
            ? "hover:bg-primary-foreground/20 text-primary-foreground"
            : "hover:bg-foreground/10 text-foreground"
        )}
        onClick={togglePlay}
        disabled={isLoading}
        aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
      >
        <div className="relative flex items-center justify-center size-full">
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <>
              <Play
                className={cn(
                  "absolute size-3.5 fill-current ml-0.5 transition-all duration-200 ease-out",
                  isPlaying ? "opacity-0 scale-50" : "opacity-100 scale-100"
                )}
              />
              <Pause
                className={cn(
                  "absolute size-3.5 fill-current transition-all duration-200 ease-out",
                  isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-50"
                )}
              />
            </>
          )}
        </div>
      </Button>

      <AudioProgressBar
        audioRef={audioRef}
        duration={duration}
        isPlaying={isPlaying}
        isSent={isSent}
      />
    </div>
  )
}
