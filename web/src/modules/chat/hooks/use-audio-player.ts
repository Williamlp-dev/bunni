import { useState, useEffect, useCallback, useRef } from "react"

type UseAudioPlayerProps = {
  src: string
  initialDuration?: number | null
}

export function useAudioPlayer({ src, initialDuration }: UseAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [duration, setDuration] = useState(initialDuration ?? 0)

  useEffect(() => {
    const audio = new Audio()
    audio.preload = "metadata"
    audio.src = src
    audioRef.current = audio

    const onMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
      setIsLoading(false)
    }
    const onCanPlay = () => setIsLoading(false)
    const onWaiting = () => setIsLoading(true)
    const onPlaying = () => setIsLoading(false)
    const onEnded = () => {
      setIsPlaying(false)
    }
    const onError = () => {
      setIsLoading(false)
      setHasError(true)
    }

    audio.addEventListener("loadedmetadata", onMetadata)
    audio.addEventListener("durationchange", onMetadata)
    audio.addEventListener("canplay", onCanPlay)
    audio.addEventListener("waiting", onWaiting)
    audio.addEventListener("playing", onPlaying)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("error", onError)

    return () => {
      audio.removeEventListener("loadedmetadata", onMetadata)
      audio.removeEventListener("durationchange", onMetadata)
      audio.removeEventListener("canplay", onCanPlay)
      audio.removeEventListener("waiting", onWaiting)
      audio.removeEventListener("playing", onPlaying)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("error", onError)
      audio.pause()
      audio.src = ""
    }
  }, [src])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || isLoading) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
    }
  }, [isPlaying, isLoading])

  return {
    audioRef,
    isPlaying,
    isLoading,
    hasError,
    duration,
    togglePlay,
  }
}
