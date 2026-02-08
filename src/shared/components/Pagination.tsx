import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    totalPages: number
    currentPage: number
    baseUrl: string
}

export function Pagination({ totalPages, currentPage, baseUrl }: PaginationProps) {
    if (totalPages < 1) return null

    // Helper to generate URL
    const createPageUrl = (page: number) => {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        return `${baseUrl}?${params.toString()}`
    }

    return (
        <div className="flex justify-center items-center space-x-2 mt-6">
            {/* Previous Button */}
            {currentPage > 1 ? (
                <Link
                    href={createPageUrl(currentPage - 1)}
                    scroll={false}
                    className="p-2 rounded-lg border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
            ) : (
                <span className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-300 dark:text-zinc-700 cursor-not-allowed">
                    <ChevronLeft className="h-5 w-5" />
                </span>
            )}

            {/* Page Numbers */}
            <div className="flex max-w-[200px] overflow-hidden justify-center items-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Simple logic: Show first, last, current, and adjacent
                    // For MVP let's show all if small, or simple range.
                    // Let's standard "show all" for now, user asked for "sheets (1, 2, 3)"
                    // If too many, we can refine.

                    if (
                        totalPages > 7 &&
                        page !== 1 &&
                        page !== totalPages &&
                        Math.abs(page - currentPage) > 1
                    ) {
                        if (Math.abs(page - currentPage) === 2) {
                            return <span key={page} className="px-2 text-gray-400">...</span>
                        }
                        return null
                    }

                    return (
                        <Link
                            key={page}
                            href={createPageUrl(page)}
                            scroll={false}
                            className={`
                                min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                                ${currentPage === page
                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
                                }
                            `}
                        >
                            {page}
                        </Link>
                    )
                })}
            </div>

            {/* Next Button */}
            {currentPage < totalPages ? (
                <Link
                    href={createPageUrl(currentPage + 1)}
                    scroll={false}
                    className="p-2 rounded-lg border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
                >
                    <ChevronRight className="h-5 w-5" />
                </Link>
            ) : (
                <span className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-300 dark:text-zinc-700 cursor-not-allowed">
                    <ChevronRight className="h-5 w-5" />
                </span>
            )}
        </div>
    )
}
