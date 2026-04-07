import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type GlobalAudioContextValue = {
  activeAudioId: string | null
  claimAudio: (id: string) => void
  releaseAudio: (id: string) => void
}

const GlobalAudioContext = createContext<GlobalAudioContextValue | null>(null)

export function GlobalAudioProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null)

  const claimAudio = useCallback((id: string) => {
    setActiveAudioId(id)
  }, [])

  const releaseAudio = useCallback((id: string) => {
    setActiveAudioId((prev) => (prev === id ? null : prev))
  }, [])

  return (
    <GlobalAudioContext.Provider value={{ activeAudioId, claimAudio, releaseAudio }}>
      {children}
    </GlobalAudioContext.Provider>
  )
}

export function useGlobalAudio(): GlobalAudioContextValue {
  const ctx = useContext(GlobalAudioContext)
  if (!ctx) throw new Error("useGlobalAudio must be used within GlobalAudioProvider")
  return ctx
}
