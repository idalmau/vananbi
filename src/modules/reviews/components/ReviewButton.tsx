'use client'

import { useState } from 'react'
import { ReviewForm } from './ReviewForm'

interface ReviewButtonProps {
    bookingId: string
    listingId: string
    className?: string
}

export function ReviewButton({ bookingId, listingId, className }: ReviewButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={className || "bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transaction-colors"}
            >
                Valorar
            </button>

            {isOpen && (
                <ReviewForm
                    bookingId={bookingId}
                    listingId={listingId}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </>
    )
}
