import { useEffect, useRef } from 'react'

interface UseIntersectionObserverProps {
  onIntersect: () => void
  enabled?: boolean
  root?: Element | Document | null
  rootMargin?: string
  threshold?: number | number[]
}

export function useIntersectionObserver({
  onIntersect,
  enabled = true,
  root = null,
  rootMargin = '0px',
  threshold = 0,
}: UseIntersectionObserverProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  
  // Usamos ref para previnir re-renders se quisermos acessar onIntersect atualizado,
  // mas aqui manter dependências limpas.
  const onIntersectRef = useRef(onIntersect)
  
  useEffect(() => {
    onIntersectRef.current = onIntersect
  }, [onIntersect])

  useEffect(() => {
    if (!enabled) return

    const element = targetRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersectRef.current()
          }
        })
      },
      { root, rootMargin, threshold }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [enabled, root, rootMargin, threshold])

  return { targetRef }
}
