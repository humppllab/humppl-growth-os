'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface ThreeDotMenuItemProps {
  label: string
  href: string
  icon?: ReactNode
  variant?: 'default' | 'destructive'
  divider?: boolean
}

export interface ThreeDotMenuProps {
  items: ThreeDotMenuItemProps[]
  className?: string
}

export function ThreeDotMenu({ items, className = '' }: ThreeDotMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 border-gray-200 text-gray-700 rounded-xl hover:bg-slate-100"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {items.map((item, index) => {
            if (item.divider) {
              return <hr key={`divider-${index}`} className="my-1" />
            }

            return (
              <Link 
                key={`${item.href}-${index}`} 
                href={item.href} 
                className="block"
                onClick={() => setIsOpen(false)}
              >
                <button
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${
                    item.variant === 'destructive'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700'
                  }`}
                >
                  {item.icon && <span className="mr-2 inline-block">{item.icon}</span>}
                  {item.label}
                </button>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
