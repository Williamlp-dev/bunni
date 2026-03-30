
import { cn } from '@/lib/utils'
import { Mic, Pause, Play, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import React from 'react'

const WAVE_BAR_COUNT = 40
const MAX_DURATION_SECONDS = 120

type RecordingStatus = 'idle' | 'recording' | 'paused'

type AudioRecorderContextValue = {
  status: RecordingStatus
  duration: number
  start: () => void
  stop: () => void
  togglePause: () => void
  send: () => void
}

const AudioRecorderContext = React.createContext<AudioRecorderContextValue | null>(null)


export function useAudioRecorderContext(): AudioRecorderContextValue {
  const ctx = React.useContext(AudioRecorderContext)
  if (!ctx) throw new Error('useAudioRecorderContext must be used within AudioRecorderProvider')
  return ctx
}

type AudioRecorderProviderProps = {
  onSend?: (blob: Blob, duration: number) => void
  children: React.ReactNode
}

export function AudioRecorderProvider({ onSend, children }: AudioRecorderProviderProps): React.JSX.Element {
  const [status, setStatus] = React.useState<RecordingStatus>('idle')
  const [duration, setDuration] = React.useState(0)

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const streamRef = React.useRef<MediaStream | null>(null)

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    if (status === 'recording') {
      interval = setInterval(() => {
        setDuration((prev) => {
          if (prev + 1 >= MAX_DURATION_SECONDS) {
            sendRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status])

  const stopMediaStream = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const start = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.start(100)
      setStatus('recording')
      setDuration(0)
    } catch {
      console.error('Failed to access microphone')
    }
  }, [])

  const stop = React.useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    stopMediaStream()
    setStatus('idle')
    setDuration(0)
  }, [stopMediaStream])

  const togglePause = React.useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    if (recorder.state === 'recording') {
      recorder.pause()
      setStatus('paused')
    } else if (recorder.state === 'paused') {
      recorder.resume()
      setStatus('recording')
    }
  }, [])

  const sendRecording = React.useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    const currentDuration = duration

    if (currentDuration < 1) {
      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
      mediaRecorderRef.current = null
      chunksRef.current = []
      stopMediaStream()
      setStatus('idle')
      setDuration(0)
      toast.error('Áudio muito curto', {
        description: 'Grave pelo menos 1 segundo antes de enviar.',
        position: 'bottom-center',
        className: 'mb-24',
      })
      return
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
      chunksRef.current = []
      stopMediaStream()
      onSend?.(blob, currentDuration)
    }

    if (recorder.state !== 'inactive') {
      recorder.stop()
    }

    mediaRecorderRef.current = null
    setStatus('idle')
    setDuration(0)
  }, [duration, onSend, stopMediaStream])

  const value = React.useMemo(
    () => ({ status, duration, start, stop, togglePause, send: sendRecording }),
    [status, duration, start, stop, togglePause, sendRecording]
  )

  React.useEffect(() => {
    return () => {
      stopMediaStream()
    }
  }, [stopMediaStream])

  return (
    <AudioRecorderContext.Provider value={value}>
      {children}
    </AudioRecorderContext.Provider>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function WaveBars({ status }: { status: RecordingStatus }): React.JSX.Element {
  const isRecording = status === 'recording'

  return (
    <div className="flex h-8 flex-1 items-center justify-center gap-1 px-2 overflow-hidden mask-linear-fade">
      {Array.from({ length: WAVE_BAR_COUNT }, (_, i) => {
        const seedHeight = 4 + ((i * 7 + 3) % 18)
        return (
          <div
            key={i}
            className={cn(
              'w-1 rounded-full',
              isRecording ? 'animate-audio-wave bg-primary shadow-brand' : 'h-1 bg-primary/20'
            )}
            style={{
              height: isRecording ? `${seedHeight}px` : '3px',
              animationDelay: isRecording ? `${(i * 0.05)}s` : undefined,
              animationDuration: isRecording ? `${0.6 + (i % 3) * 0.1}s` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

type AudioRecorderOverlayProps = {
  hideSendButton?: boolean
}

export function AudioRecorderOverlay({ hideSendButton = false }: AudioRecorderOverlayProps): React.JSX.Element {
  const { status, duration, stop, togglePause, send } = useAudioRecorderContext()
  const isOpen = status !== 'idle'

  return (
    <div
      data-state={isOpen ? 'open' : 'closed'}
      className={cn(
        "absolute inset-0 z-10 flex items-center gap-2 rounded-md bg-background px-2 border border-input",
        "data-[state=closed]:opacity-0 data-[state=closed]:pointer-events-none data-[state=closed]:clip-path-[inset(0_0_0_100%)]",
        "data-[state=open]:opacity-100 data-[state=open]:clip-path-[inset(0_0_0_0)]"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 size-9 rounded-full btn-press"
        onClick={stop}
        aria-label="Discard recording"
      >
        <Trash2 className="size-4" />
      </Button>

      <WaveBars status={status} />

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            'min-w-12 text-center font-mono text-xs font-medium tabular-nums px-2 py-1 rounded-md bg-muted',
            status === 'recording' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {formatTime(duration)}
        </span>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="rounded-full size-9 shadow-sm"
          onClick={togglePause}
          aria-label={status === 'recording' ? 'Pause recording' : 'Resume recording'}
        >
          <div className="relative flex items-center justify-center size-full">
            <Pause
              className={cn(
                'absolute size-4 fill-current',
                status === 'recording'
                  ? 'opacity-100 scale-100 blur-0'
                  : 'opacity-0 scale-50 blur-sm'
              )}
            />
            <Play
              className={cn(
                'absolute size-4 fill-current ml-1',
                status === 'recording'
                  ? 'opacity-0 scale-50 blur-sm'
                  : 'opacity-100 scale-100 blur-0'
              )}
            />
          </div>
        </Button>

        {!hideSendButton && (
          <Button
            type="button"
            size="icon"
            className="rounded-full size-9 shadow-sm animate-in zoom-in-50 duration-300"
            onClick={send}
            aria-label="Send recording"
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

type AudioRecorderTriggerProps = {
  disabled?: boolean
  className?: string
  onSubmitBehavior?: 'send' | 'stop'
}

export function AudioRecorderTrigger({ disabled, className, onSubmitBehavior = 'stop' }: AudioRecorderTriggerProps): React.JSX.Element {
  const { status, start, stop, send } = useAudioRecorderContext()
  const isActive = status !== 'idle'

  const handleClick = () => {
    if (isActive) {
      if (onSubmitBehavior === 'send') {
        send()
      } else {
        stop()
      }
    } else {
      start()
    }
  }

  return (
    <Button
      type="button"
      disabled={disabled}
      variant="ghost"
      size="icon"
      className={cn(
        'relative',
        isActive && 'bg-primary text-primary-foreground rotate-0 scale-100',
        className
      )}
      onClick={handleClick}
      aria-label={isActive ? (onSubmitBehavior === 'send' ? 'Send recording' : 'Stop recording') : 'Start recording'}
    >
      <div className="relative flex items-center justify-center size-full">
        <Mic
          className={cn(
            'absolute size-5',
            isActive ? 'opacity-0 scale-50 blur-sm' : 'opacity-100 scale-100 blur-0'
          )}
        />

        <Send
          className={cn(
            'absolute size-5',
            isActive ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-50 blur-sm'
          )}
        />
      </div>
    </Button>
  )
}
