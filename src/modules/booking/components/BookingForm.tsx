'use client'

import { useActionState, useState, useEffect, useRef } from 'react'
import { createBooking } from '@/modules/booking/actions'
import { Listing, RULE_OPTIONS } from '@/modules/listings/types'
import { cn } from '@/shared/lib/utils'
import { DayPicker, DateRange } from 'react-day-picker'
import { es } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'
import { differenceInCalendarDays, format } from 'date-fns'
import { getAvailabilityModifiers, isRangeBlocked } from '@/modules/listings/utils'
import { X, ArrowLeft, CheckCircle2, ShieldCheck, Info } from 'lucide-react'

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
    const [showSummary, setShowSummary] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

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

            <form ref={formRef} action={formAction} className="flex flex-col gap-4">
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

                {dateError && (
                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">{dateError}</p>
                )}
                
                {state?.error && (
                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">{state.error}</p>
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
                        type="button"
                        onClick={() => setShowSummary(true)}
                        disabled={isPending || !totalPrice || !!dateError}
                        className={cn(
                            "w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
                        )}
                    >
                        Reservar
                    </button>
                )}
            </form>
            <p className="mt-4 text-center text-xs text-gray-500">No se te cobrará todavía</p>

            {/* Pre-payment Summary Overlay */}
            {showSummary && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-4 border-b dark:border-zinc-800 flex items-center justify-between">
                            <button 
                                onClick={() => setShowSummary(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <h2 className="text-lg font-bold">Confirma tu reserva</h2>
                            <div className="w-9" /> {/* Spacer */}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Trip Info */}
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Tu viaje</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold">Fechas</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {format(range!.from!, 'd MMM')} – {format(range!.to!, 'd MMM, yyyy')}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setShowSummary(false)}
                                            className="text-sm font-bold underline underline-offset-4"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-gray-100 dark:bg-zinc-800" />

                            {/* Booking Type Info */}
                            <section>
                                <div className={cn(
                                    "p-4 rounded-xl border flex gap-4",
                                    listing.booking_type === 'instant' 
                                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50"
                                        : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50"
                                )}>
                                    {listing.booking_type === 'instant' ? (
                                        <>
                                            <CheckCircle2 className="h-6 w-6 text-yellow-600 shrink-0" />
                                            <div>
                                                <p className="font-bold text-yellow-900 dark:text-yellow-200">Reserva Inmediata</p>
                                                <p className="text-sm text-yellow-800 dark:text-yellow-300/80">
                                                    Tu reserva se confirmará automáticamente. El anfitrión ya tiene este calendario actualizado.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Info className="h-6 w-6 text-blue-600 shrink-0" />
                                            <div>
                                                <p className="font-bold text-blue-900 dark:text-blue-200">Solicitud de reserva</p>
                                                <p className="text-sm text-blue-800 dark:text-blue-300/80">
                                                    El anfitrión tiene 24 horas para aceptar tu solicitud. No se realizará ningún cargo hasta que acepte.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>

                            <div className="h-px bg-gray-100 dark:bg-zinc-800" />

                            {/* Rules */}
                            {listing.rules && listing.rules.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Normas del vehículo</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {listing.rules.map(ruleId => {
                                            const rule = RULE_OPTIONS.find(opt => opt.id === ruleId)
                                            return (
                                                <div key={ruleId} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <span className="text-lg">{rule?.icon}</span>
                                                    <span>{rule?.label || ruleId}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            )}

                            <div className="h-px bg-gray-100 dark:bg-zinc-800" />

                            {/* Pricing Details */}
                            <section>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Detalles del precio</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(listing.price_per_night / 100)} x {differenceInCalendarDays(range!.to!, range!.from!)} noches
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPrice! / 100)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-bold pt-3 border-t dark:border-zinc-800">
                                        <span>Total (EUR)</span>
                                        <span>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPrice! / 100)}</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer / CTA */}
                        <div className="p-6 border-t dark:border-zinc-800 space-y-4">
                            {state?.error && (
                                <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">{state.error}</p>
                            )}
                            <p className="text-[10px] text-center text-gray-500 leading-relaxed">
                                Al hacer clic en el botón inferior, aceptas las normas del vehículo, las condiciones de cancelación y los Términos de Servicio de Vananbi.
                            </p>
                            <button
                                onClick={() => {
                                    formRef.current?.requestSubmit()
                                }}
                                disabled={isPending}
                                className={cn(
                                    "w-full rounded-xl py-4 text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-2",
                                    listing.booking_type === 'instant' ? "bg-black dark:bg-white dark:text-black" : "bg-blue-600 hover:bg-blue-500"
                                )}
                            >
                                {isPending ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="h-5 w-5" />
                                        {listing.booking_type === 'instant' ? 'Confirmar y Reservar' : 'Enviar Solicitud'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
