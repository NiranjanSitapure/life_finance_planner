import React from 'react'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export function SectionWrapper({ title, subtitle, children, actions }: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
