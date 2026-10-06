import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type TabItem = {
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
}

export type TabsProps = {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="border-b border-base">
        <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-thin" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-base hover:text-base hover:border-transparent'
              )}
            >
              {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
