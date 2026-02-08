'use client'

import { useActionState, useState, useEffect } from 'react'
import { createBooking } from '@/modules/booking/actions'
import { Listing } from '@/modules/listings/types'
import { cn } from '@/shared/lib/utils'
import { DayPicker, DateRange } from 'react-day-picker'
import { es } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'
import { differenceInCalendarDays, format } from 'date-fns'
import { getAvailabilityModifiers, isRangeBlocked } from '@/modules/listings/utils'

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
    // Range State
    const [range, setRange] = useState<DateRange | undefined>(() => {
        if (initialStartDate && initialEndDate) {
            return {
                from: new Date(initialStartDate),
                to: new Date(initialEndDate)
            }
        }
        return undefined
    })

    const [totalPrice, setTotalPrice] = useState<number | null>(null)
    const [dateError, setDateError] = useState('')

    // Derived values for form submission (hidden inputs) (YYYY-MM-DD)
    const startDateStr = range?.from ? format(range.from, 'yyyy-MM-dd') : ''
    // If range.to is undefined (single day selection), we might default to same day or wait. 
    // Logic: require both dates.
    const endDateStr = range?.to ? format(range.to, 'yyyy-MM-dd') : ''

    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        return createBooking(formData)
    }, initialState)

    // Construct login URL with persistence
    const getLoginParams = () => {
        const nextPath = `/listings/${listing.id}`
        const params = new URLSearchParams()
        if (startDateStr) params.set('startDate', startDateStr)
        if (endDateStr) params.set('endDate', endDateStr)

        const fullNextPath = params.toString() ? `${nextPath}?${params.toString()}` : nextPath
        return `/login?next=${encodeURIComponent(fullNextPath)}`
    }



    // ... (in BookingForm)

    // Convert bookedDates to Date objects using shared util
    const disabledDays = getAvailabilityModifiers(bookedDates as any)

    // Add "Before Today" to disabled
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const disabled = [
        ...disabledDays,
        { before: today }
    ]

    useEffect(() => {
        setDateError('')
        setTotalPrice(null)

        if (range?.from && range?.to) {
            const days = differenceInCalendarDays(range.to, range.from)

            if (days > 0) {
                // Check overlap using shared util
                const startStr = format(range.from, 'yyyy-MM-dd')
                const endStr = format(range.to, 'yyyy-MM-dd')

                const isBlocked = isRangeBlocked(startStr, endStr, bookedDates as any)

                if (isBlocked) {
                    setDateError('El rango seleccionado incluye fechas no disponibles.')
                } else {
                    setTotalPrice(days * listing.price_per_night)
                }

            } else {
                setTotalPrice(null)
            }
        }
    }, [range, listing.price_per_night, bookedDates])

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
                <input type="hidden" name="startDate" value={startDateStr} />
                <input type="hidden" name="endDate" value={endDateStr} />

                {/* Calendar Container */}
                <div className="border rounded-xl p-4 flex justify-center bg-white dark:bg-black dark:border-zinc-800">
                    <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={setRange}
                        locale={es}
                        disabled={disabled}
                        min={1}
                        className="!m-0" // Override margin
                        modifiersClassNames={{
                            selected: "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black",
                            today: "font-bold text-blue-600",
                            disabled: "text-gray-300 opacity-50 cursor-not-allowed line-through",
                        }}
                        styles={{
                            day: { borderRadius: '50%' } // Round date circles
                        }}
                    />
                </div>

                {/* Date Summary */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="border rounded-lg px-3 py-2 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                        <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Llegada</span>
                        <div className="font-medium dark:text-white">{range?.from ? format(range.from, 'dd/MM/yyyy') : '-'}</div>
                    </div>
                    <div className="border rounded-lg px-3 py-2 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                        <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Salida</span>
                        <div className="font-medium dark:text-white">{range?.to ? format(range.to, 'dd/MM/yyyy') : '-'}</div>
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
        </div>
    )
}
