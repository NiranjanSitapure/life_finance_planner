import { useState, useRef, useEffect, useLayoutEffect } from 'react'

interface Props {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right' // hint; auto-flips if no room
}

const PANEL_WIDTH = 256
const PANEL_GAP = 8         // space between icon and panel
const VIEWPORT_PADDING = 8  // min distance from viewport edge

export function InfoTooltip({ content, position = 'top' }: Props) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node
      const insideWrapper = wrapperRef.current?.contains(t)
      const insidePanel = panelRef.current?.contains(t)
      if (!insideWrapper && !insidePanel) setVisible(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Measure trigger + panel after render and pick the side with the most room.
  // Runs before paint so the panel never flashes at the wrong location.
  useLayoutEffect(() => {
    if (!visible || !triggerRef.current || !panelRef.current) return
    const trigger = triggerRef.current.getBoundingClientRect()
    const panel = panelRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    const room = {
      top: trigger.top,
      bottom: vh - trigger.bottom,
      left: trigger.left,
      right: vw - trigger.right,
    }
    const fits = {
      top: room.top >= panel.height + PANEL_GAP + VIEWPORT_PADDING,
      bottom: room.bottom >= panel.height + PANEL_GAP + VIEWPORT_PADDING,
      left: room.left >= panel.width + PANEL_GAP + VIEWPORT_PADDING,
      right: room.right >= panel.width + PANEL_GAP + VIEWPORT_PADDING,
    }
    const chosen = fits[position]
      ? position
      : (['bottom', 'top', 'right', 'left'] as const)
          .slice()
          .sort((a, b) => room[b] - room[a])[0]

    let top = 0
    let left = 0
    if (chosen === 'top') {
      top = trigger.top - panel.height - PANEL_GAP
      left = trigger.left + trigger.width / 2 - panel.width / 2
    } else if (chosen === 'bottom') {
      top = trigger.bottom + PANEL_GAP
      left = trigger.left + trigger.width / 2 - panel.width / 2
    } else if (chosen === 'left') {
      top = trigger.top + trigger.height / 2 - panel.height / 2
      left = trigger.left - panel.width - PANEL_GAP
    } else {
      top = trigger.top + trigger.height / 2 - panel.height / 2
      left = trigger.right + PANEL_GAP
    }

    // Clamp into viewport so the panel can never overflow off-screen.
    left = Math.max(VIEWPORT_PADDING, Math.min(left, vw - panel.width - VIEWPORT_PADDING))
    top = Math.max(VIEWPORT_PADDING, Math.min(top, vh - panel.height - VIEWPORT_PADDING))

    setCoords({ top, left })
  }, [visible, position, content])

  // Recompute on scroll/resize while open so the panel tracks the icon.
  useEffect(() => {
    if (!visible) return
    const reposition = () => setCoords(null) // triggers re-measure via layout effect
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [visible])

  // Reset coords when hiding so the next open measures fresh
  useEffect(() => { if (!visible) setCoords(null) }, [visible])

  return (
    <div ref={wrapperRef} className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setVisible(v => !v)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="w-4 h-4 rounded-full bg-slate-600 hover:bg-slate-500 text-slate-300 text-xs flex items-center justify-center transition-colors flex-shrink-0 leading-none"
        aria-label="More information"
      >
        i
      </button>
      {visible && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: coords?.top ?? 0,
            left: coords?.left ?? 0,
            width: `min(${PANEL_WIDTH}px, calc(100vw - ${VIEWPORT_PADDING * 2}px))`,
            visibility: coords ? 'visible' : 'hidden',
            zIndex: 50,
          }}
        >
          <div className="bg-slate-700 border border-slate-500 rounded-lg p-3 text-xs text-slate-200 leading-relaxed shadow-xl">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
