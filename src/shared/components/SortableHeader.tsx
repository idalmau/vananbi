'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

interface SortableHeaderProps {
    label: string
    value: string
    currentSort: string
    currentOrder: 'asc' | 'desc'
    className?: string
}

export function SortableHeader({ label, value, currentSort, currentOrder, className = '' }: SortableHeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleClick = () => {
        const params = new URLSearchParams(searchParams)

        if (currentSort === value) {
            // Toggle order if already sorting by this column
            params.set('order', currentOrder === 'asc' ? 'desc' : 'asc')
        } else {
            // New sort column, default to desc for dates usually, but let's stick to simple default.
            // Actually for dates 'desc' (newest first) is usually preferred as default.
            // For text 'asc' is preferred.
            // Let's default to 'desc' as most of our sortable columns are dates/timestamps.
            params.set('sort', value)
            params.set('order', 'desc')
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const isActive = currentSort === value

    return (
        <th
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group select-none ${className}`}
            onClick={handleClick}
        >
            <div className="flex items-center gap-1">
                {label}
                <span className="text-gray-400">
                    {isActive ? (
                        currentOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-black dark:text-white" /> : <ArrowDown className="h-3 w-3 text-black dark:text-white" />
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                    )}
                </span>
            </div>
        </th>
    )
}
