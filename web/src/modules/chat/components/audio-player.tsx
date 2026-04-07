import { useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Play, Pause, Loader2, MicOff, RotateCcw } from "lucide-react"
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

function AudioSeekbar({
  audioRef,
  duration,
  isPlaying,
  isLoading,
  isSent,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>
  duration: number
  isPlaying: boolean
  isLoading: boolean
  isSent: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const durationRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number>(0)
  const isDraggingRef = useRef(false)

  const applyRatio = useCallback(
    (ratio: number, currentTime?: number) => {
      const pct = `${ratio * 100}%`

      if (fillRef.current) fillRef.current.style.width = pct
      if (thumbRef.current) thumbRef.current.style.left = pct

      if (timeRef.current) {
        const t = currentTime ?? (duration > 0 ? ratio * duration : 0)
        timeRef.current.textContent = formatTime(t)
      }
    },
    [duration]
  )

  const syncFromAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio || isDraggingRef.current) return
    const ratio = duration > 0 ? Math.max(0, Math.min(1, audio.currentTime / duration)) : 0
    applyRatio(ratio, audio.currentTime)
  }, [audioRef, duration, applyRatio])

  const tick = useCallback(() => {
    syncFromAudio()
    rafRef.current = requestAnimationFrame(tick)
  }, [syncFromAudio])

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
      syncFromAudio()
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, tick, syncFromAudio])

  useEffect(() => {
    if (durationRef.current) durationRef.current.textContent = formatTime(duration)
  }, [duration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => applyRatio(1, duration)
    const onSeeked = () => { if (!isDraggingRef.current) syncFromAudio() }
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("seeked", onSeeked)
    return () => {
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("seeked", onSeeked)
    }
  }, [audioRef, duration, applyRatio, syncFromAudio])

  const getRatioFromPointer = (e: PointerEvent | React.PointerEvent): number => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!duration || isLoading) return
    const track = trackRef.current
    if (!track) return

    isDraggingRef.current = true
    track.setPointerCapture(e.pointerId)
    applyRatio(getRatioFromPointer(e))

    const onMove = (ev: PointerEvent) => applyRatio(getRatioFromPointer(ev))

    const onUp = (ev: PointerEvent) => {
      isDraggingRef.current = false
      const ratio = getRatioFromPointer(ev)
      applyRatio(ratio)
      if (audioRef.current) audioRef.current.currentTime = ratio * duration
      track.removeEventListener("pointermove", onMove)
      track.removeEventListener("pointerup", onUp)
    }

    track.addEventListener("pointermove", onMove)
    track.addEventListener("pointerup", onUp)
  }

  return (
    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        role="slider"
        aria-label="Progresso do áudio"
        aria-valuemin={0}
        aria-valuemax={duration}
        className={cn(
          "relative w-full cursor-pointer touch-none select-none group/seek py-2 -my-2",
          isLoading && "pointer-events-none opacity-50"
        )}
      >
        <div
          className={cn(
            "relative h-1 w-full rounded-full overflow-visible",
            isSent ? "bg-primary-foreground/25" : "bg-foreground/15"
          )}
        >
          <div
            ref={fillRef}
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-none",
              isSent ? "bg-primary-foreground/80" : "bg-primary"
            )}
            style={{ width: "0%" }}
          />
        </div>

        <div
          ref={thumbRef}
          className={cn(
            "absolute size-3 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-sm",
            "scale-0 group-hover/seek:scale-100 transition-transform duration-150",
            isSent ? "bg-primary-foreground" : "bg-primary"
          )}
          style={{ left: "0%" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          ref={timeRef}
          className={cn(
            "text-[11px] font-mono tabular-nums leading-none",
            isSent ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          0:00
        </span>
        <span
          ref={durationRef}
          className={cn(
            "text-[11px] font-mono tabular-nums leading-none",
            isSent ? "text-primary-foreground/60" : "text-muted-foreground"
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

  const {
    audioRef,
    duration,
    hasError,
    isLoading,
    isPlaying,
    playbackRate,
    togglePlay,
    skipBackward,
    cyclePlaybackRate,
  } = useAudioPlayer({ src, initialDuration })

  if (hasError) {
    return (
      <div className={cn("flex items-center gap-2 py-1 px-1 opacity-50", className)}>
        <MicOff className="size-4 shrink-0" />
        <span className="text-xs">Áudio indisponível</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2.5 py-0.5 w-56", className)}>
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoading}
        aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
        className={cn(
          "relative shrink-0 size-8 rounded-full flex items-center justify-center outline-none",
          "transition-transform duration-100 active:scale-90",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isSent
            ? "bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground"
            : "bg-foreground/8 hover:bg-foreground/12 text-foreground"
        )}
      >
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <>
            <Play
              className={cn(
                "absolute size-3.5 fill-current ml-0.5 transition-[opacity,transform] duration-150",
                isPlaying ? "opacity-0 scale-50" : "opacity-100 scale-100"
              )}
            />
            <Pause
              className={cn(
                "absolute size-3.5 fill-current transition-[opacity,transform] duration-150",
                isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-50"
              )}
            />
          </>
        )}
      </button>

      <AudioSeekbar
        audioRef={audioRef}
        duration={duration}
        isPlaying={isPlaying}
        isLoading={isLoading}
        isSent={isSent}
      />

      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => skipBackward(5)}
          disabled={isLoading}
          aria-label="Voltar 5 segundos"
          className={cn(
            "flex items-center justify-center size-6 rounded-full outline-none",
            "transition-opacity disabled:opacity-30",
            isSent
              ? "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
          )}
        >
          <RotateCcw className="size-3" />
        </button>

        <button
          type="button"
          onClick={cyclePlaybackRate}
          disabled={isLoading}
          aria-label={`Velocidade: ${playbackRate}x`}
          className={cn(
            "flex items-center justify-center h-5 px-1 rounded-full outline-none",
            "text-[10px] font-bold tabular-nums leading-none",
            "transition-all disabled:opacity-30",
            isSent
              ? "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
          )}
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  )
}
