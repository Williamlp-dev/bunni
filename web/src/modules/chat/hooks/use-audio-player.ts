import { useRef, useEffect, useCallback, useState } from "react"
import { useGlobalAudio } from "./use-global-audio.tsx"

type UseAudioPlayerProps = {
  src: string
  initialDuration?: number | null
}

type PlaybackRate = 1 | 1.5 | 2

const PLAYBACK_RATES: PlaybackRate[] = [1, 1.5, 2]

export function useAudioPlayer({ src, initialDuration }: UseAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [duration, setDuration] = useState(initialDuration ?? 0)
  const [playbackRate, setPlaybackRateState] = useState<PlaybackRate>(1)

  const { activeAudioId, claimAudio, releaseAudio } = useGlobalAudio()
  const isActive = activeAudioId === src

  useEffect(() => {
    if (!isActive && isPlaying) {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        setIsPlaying(false)
      }
    }
  }, [isActive, isPlaying])

  useEffect(() => {
    const audio = new Audio()
    audio.preload = "metadata"
    audio.crossOrigin = "anonymous"
    audio.src = src
    audioRef.current = audio

    const setReady = () => {
      setIsLoading(false)
      setHasError(false)
    }

    const onMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
      setReady()
    }
    const onWaiting = () => setIsLoading(true)
    const onEnded = () => {
      setIsPlaying(false)
      releaseAudio(src)
    }
    const onError = () => {
      setIsLoading(false)
      if (audio.error) setHasError(true)
    }

    audio.addEventListener("loadedmetadata", onMetadata)
    audio.addEventListener("durationchange", onMetadata)
    audio.addEventListener("canplay", setReady)
    audio.addEventListener("waiting", onWaiting)
    audio.addEventListener("playing", setReady)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("error", onError)

    return () => {
      audio.removeEventListener("loadedmetadata", onMetadata)
      audio.removeEventListener("durationchange", onMetadata)
      audio.removeEventListener("canplay", setReady)
      audio.removeEventListener("waiting", onWaiting)
      audio.removeEventListener("playing", setReady)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("error", onError)
      audio.pause()
      audio.src = ""
      releaseAudio(src)
    }
  }, [src, releaseAudio])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      releaseAudio(src)
    } else {
      claimAudio(src)
      try {
        await audio.play()
        setIsPlaying(true)
        setIsLoading(false)
      } catch {
        setIsPlaying(false)
        releaseAudio(src)
        setHasError(true)
      }
    }
  }, [isPlaying, src, claimAudio, releaseAudio])

  const skipBackward = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, audio.currentTime - seconds)
  }, [])

  const cyclePlaybackRate = useCallback(() => {
    const audio = audioRef.current
    setPlaybackRateState((prev) => {
      const currentIndex = PLAYBACK_RATES.indexOf(prev)
      const next = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length]
      if (audio) audio.playbackRate = next
      return next
    })
  }, [])

  return {
    audioRef,
    isPlaying,
    isLoading,
    hasError,
    duration,
    playbackRate,
    togglePlay,
    skipBackward,
    cyclePlaybackRate,
  }
}
