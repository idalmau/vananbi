'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface PageSizeSelectorProps {
    currentLimit: number
    options?: number[]
}

export function PageSizeSelector({ currentLimit, options = [10, 20, 50, 100] }: PageSizeSelectorProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleLimitChange = (newLimit: number) => {
        const params = new URLSearchParams(searchParams)
        params.set('limit', newLimit.toString())
        params.set('page', '1') // Reset to first page when changing limit
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Mostrar</span>
            <select
                value={currentLimit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="block rounded-md border-gray-300 dark:border-zinc-700 py-1.5 pl-3 pr-10 text-base focus:border-black focus:outline-none focus:ring-black sm:text-sm dark:bg-zinc-800 dark:text-white"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            <span>por página</span>
        </div>
    )
}
