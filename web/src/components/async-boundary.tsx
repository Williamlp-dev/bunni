import { Suspense, type ReactNode } from "react"
import { ErrorBoundary } from "react-error-boundary"

interface Props {
  fallback: ReactNode
  errorFallback: ReactNode | ((props: any) => ReactNode)
  children: ReactNode
}

export function AsyncBoundary({ fallback, errorFallback, children }: Props) {
  return (
    <ErrorBoundary fallbackRender={typeof errorFallback === "function" ? errorFallback as any : () => errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}
