'use client'

import { useState } from 'react'
import { payForBooking } from '../actions'

export function PayBookingButton({ bookingId, amount }: { bookingId: string, amount: number }) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handlePayment = async () => {
        setIsLoading(true)
        setError(null)
        const result = await payForBooking(bookingId)
        
        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        }
        // If successful, it redirects, so we don't necessarily need to turn off loading.
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full bg-black text-white dark:bg-white dark:text-black font-semibold py-3 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Procesando...
                    </span>
                ) : (
                    `Pagar ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount / 100)}`
                )}
            </button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>
    )
}
