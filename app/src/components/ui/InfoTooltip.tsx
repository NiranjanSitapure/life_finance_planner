import { useState, useRef, useEffect } from 'react'

interface Props {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function InfoTooltip({ content, position = 'top' }: Props) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
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
        <div className={`absolute z-50 w-64 ${positionClasses[position]}`}>
          <div className="bg-slate-700 border border-slate-500 rounded-lg p-3 text-xs text-slate-200 leading-relaxed shadow-xl">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
