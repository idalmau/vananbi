
'use client'

import { useActionState, useState, useEffect } from 'react'
import { createBooking } from '@/modules/booking/actions' // Correction: need to ensure path is correct
import { Listing } from '@/modules/listings/types'
import { cn } from '@/shared/lib/utils'

interface BookingFormProps {
    listing: Listing
    user: any // Supabase user object or null
}

const initialState = {
    error: '',
}

export function BookingForm({
    listing,
    user,
    bookedDates = [],
    initialStartDate = '',
    initialEndDate = '',
    userBookings = []
}: BookingFormProps & {
    bookedDates?: { start_date: string, end_date: string }[],
    initialStartDate?: string,
    initialEndDate?: string,
    userBookings?: any[]
}) {
    // Simple Date State (YYYY-MM-DD)
    const [startDate, setStartDate] = useState(initialStartDate)
    const [endDate, setEndDate] = useState(initialEndDate)
    const [totalPrice, setTotalPrice] = useState<number | null>(null)
    const [dateError, setDateError] = useState('')
    const [overlapWarning, setOverlapWarning] = useState('')

    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        return createBooking(formData)
    }, initialState)

    // Construct login URL with persistence
    const getLoginParams = () => {
        const nextPath = `/listings/${listing.id}`
        const params = new URLSearchParams()
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)

        const fullNextPath = params.toString() ? `${nextPath}?${params.toString()}` : nextPath
        return `/login?next=${encodeURIComponent(fullNextPath)}`
    }

    // Helper to check if a range overlaps with booked dates
    const checkOverlap = (start: string, end: string) => {
        if (!bookedDates.length) return false
        return bookedDates.some(booking => {
            const bStart = booking.start_date
            const bEnd = booking.end_date
            // Basic string comparison works for ISO dates (YYYY-MM-DD)
            // Overlap logic: (StartA < EndB) and (EndA > StartB)
            return start < bEnd && end > bStart
        })
    }

    // Helper to check if range overlaps with OWN bookings
    const checkSelfOverlap = (start: string, end: string) => {
        if (!userBookings?.length) return null
        return userBookings.find(booking => {
            // Skip cancelled
            if (booking.status === 'cancelled') return false
            const bStart = booking.start_date
            const bEnd = booking.end_date
            return start < bEnd && end > bStart
        })
    }

    useEffect(() => {
        setDateError('')
        setOverlapWarning('')
        if (startDate && endDate) {
            // Validate order
            if (startDate > endDate) {
                setDateError('La fecha de salida debe ser posterior a la de llegada.')
                setTotalPrice(null)
                return
            }

            // Validate availability (Block)
            if (checkOverlap(startDate, endDate)) {
                setDateError('Estas fechas no están disponibles.')
                setTotalPrice(null)
                return
            }

            // Validate Self-Overlap (Warning)
            const overlap = checkSelfOverlap(startDate, endDate)
            if (overlap) {
                setOverlapWarning(`Ojo: Ya tienes una reserva en estas fechas (${overlap.listing.title}).`)
            }

            const start = new Date(startDate)
            const end = new Date(endDate)
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays > 0) {
                setTotalPrice(diffDays * listing.price_per_night)
            } else {
                setTotalPrice(null)
            }
        } else {
            setTotalPrice(null)
        }
    }, [startDate, endDate, listing.price_per_night, userBookings])

    // Get today's date for min attribute
    const today = new Date().toISOString().split('T')[0]

    // Calculate min end date (Start + 1 day)
    const getMinEndDate = () => {
        if (!startDate) return today
        const start = new Date(startDate)
        start.setDate(start.getDate() + 1)
        return start.toISOString().split('T')[0]
    }

    // Auto-set End Date when Start Date changes
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value
        setStartDate(newStart)

        if (newStart) {
            const start = new Date(newStart)
            const nextDay = new Date(start)
            nextDay.setDate(nextDay.getDate() + 1)
            const nextDayStr = nextDay.toISOString().split('T')[0]

            // If endDate is empty or before the new start date, update it to the next day
            if (!endDate || endDate <= newStart) {
                setEndDate(nextDayStr)
            }
        }
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 sticky top-24">
            <div className="flex items-baseline justify-between mb-6">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(listing.price_per_night / 100)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">noche</span>
            </div>

            <form action={formAction} className="flex flex-col gap-4">
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="pricePerNight" value={listing.price_per_night} />

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Llegada</label>
                        <input
                            type="date"
                            name="startDate"
                            min={today}
                            required
                            value={startDate}
                            onChange={handleStartDateChange}
                            className="p-2 border rounded-md text-sm border-gray-300 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase text-gray-500">Salida</label>
                        <input
                            type="date"
                            name="endDate"
                            min={getMinEndDate()}
                            required
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="p-2 border rounded-md text-sm border-gray-300 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                        />
                    </div>
                </div>

                {totalPrice !== null && !dateError && (
                    <div className="py-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span className="underline">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(listing.price_per_night / 100)} x {totalPrice / listing.price_per_night} noches
                            </span>
                            <span>
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPrice / 100)}
                            </span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-100 dark:border-zinc-800">
                            <span className="text-gray-900 dark:text-white">Total</span>
                            <span className="text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPrice / 100)}
                            </span>
                        </div>
                    </div>
                )}

                {state?.error && (
                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">{state.error}</p>
                )}

                {dateError && (
                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">{dateError}</p>
                )}

                {/* Overlap Warning */}
                {overlapWarning && (
                    <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                        {overlapWarning}
                    </div>
                )}

                {!user ? (
                    <a
                        href={getLoginParams()}
                        className="block w-full text-center rounded-lg bg-black text-white px-4 py-3 font-semibold hover:bg-gray-800 dark:bg-white dark:text-black mt-2 active:scale-95 transition-transform"
                    >
                        Iniciar sesión para reservar
                    </a>
                ) : (
                    <button
                        type="submit"
                        disabled={isPending || !totalPrice || !!dateError}
                        className={cn(
                            "w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
                        )}
                    >
                        {isPending ? 'Reservando...' : 'Reservar'}
                    </button>
                )}
            </form>
            <p className="mt-4 text-center text-xs text-gray-500">No se te cobrará todavía</p>

            {/* Simple Unavailability List for MVP Visibility */}
            {bookedDates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <p className="text-xs font-medium text-gray-500 mb-2">Fechas no disponibles:</p>
                    <ul className="text-xs text-gray-400 space-y-1">
                        {bookedDates.slice(0, 3).map((b, i) => (
                            <li key={i}>{new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}</li>
                        ))}
                        {bookedDates.length > 3 && <li>... y más fechas</li>}
                    </ul>
                </div>
            )}
        </div>
    )
}
