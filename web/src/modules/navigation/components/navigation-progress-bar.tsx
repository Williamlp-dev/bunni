import type React from "react"

type Props = { isVisible: boolean }

export function NavigationProgressBar({ isVisible }: Props): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={`
        absolute top-0 left-0 right-0 h-[2px] z-50 overflow-hidden
        transition-opacity duration-300
        ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      <div className="h-full w-full bg-primary/20">
        <div className="h-full bg-primary animate-navigation-progress origin-left" />
      </div>
    </div>
  )
}
