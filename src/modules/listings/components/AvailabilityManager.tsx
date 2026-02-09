'use client'

import { useState, useTransition } from 'react'
import { DayPicker, DateRange } from 'react-day-picker'
import { es } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'
import { blockDates, unblockDates } from '@/modules/listings/actions'
import { format } from 'date-fns'
import { getAvailabilityModifiers, isRangeBlocked } from '@/modules/listings/utils'

interface AvailabilityBlock {
    start_date: string
    end_date: string
    source: 'booking' | 'block'
    id?: string
}

interface AvailabilityManagerProps {
    listingId: string
    availability: AvailabilityBlock[]
}

export function AvailabilityManager({ listingId, availability }: AvailabilityManagerProps) {
    const [range, setRange] = useState<DateRange | undefined>()
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState('')

    const bookings = availability.filter(a => a.source === 'booking')
    const blocks = availability.filter(a => a.source === 'block')

    const bookedModifiers = getAvailabilityModifiers(bookings)
    const blockedModifiers = getAvailabilityModifiers(blocks)

    // Handlers
    const handleBlock = () => {
        if (!range?.from) return
        const from = range.from
        const to = range.to || range.from

        startTransition(async () => {
            const res = await blockDates(
                listingId,
                from,
                to
            )
            if (res.error) {
                setMessage('Error: ' + res.error)
            } else {
                setMessage('Fechas bloqueadas correctamente.')
                setRange(undefined)
            }
        })
    }

    const handleUnblock = () => {
        if (!range?.from) return

        // Find blocks interacting with selection
        const startStr = format(range.from, 'yyyy-MM-dd')
        const endStr = range.to ? format(range.to, 'yyyy-MM-dd') : startStr

        const intersectingBlocks = blocks.filter(b => {
            return isRangeBlocked(startStr, endStr, [b])
        })

        if (intersectingBlocks.length === 0) return

        startTransition(async () => {
            for (const block of intersectingBlocks) {
                if (block.id) {
                    await unblockDates(block.id, listingId)
                }
            }
            setMessage('Fechas desbloqueadas.')
            setRange(undefined)
        })
    }

    // Determine state of current selection
    let selectionStatus: 'free' | 'has_booking' | 'has_block' = 'free'

    if (range?.from) {
        const startStr = format(range.from, 'yyyy-MM-dd')
        const endStr = range.to ? format(range.to, 'yyyy-MM-dd') : startStr

        const hitsBooking = isRangeBlocked(startStr, endStr, bookings)
        const hitsBlock = isRangeBlocked(startStr, endStr, blocks)

        if (hitsBooking) selectionStatus = 'has_booking'
        else if (hitsBlock) selectionStatus = 'has_block'
    }

    // ...

    return (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Gestionar Disponibilidad</h3>
            <p className="text-sm text-gray-500 mb-4">
                Selecciona fechas para bloquear o desbloquear. Las reservas existentes no se pueden modificar aquí.
            </p>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="border rounded-xl p-4 inline-block bg-white dark:bg-black dark:border-zinc-800">
                    <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={setRange}
                        locale={es}
                        // Disable bookings so they can't be selected/overlapped?
                        // If we disable them, we can't select them to see info.
                        // Let's just style them.
                        modifiers={{
                            booked: bookedModifiers,
                            blocked: blockedModifiers
                        }}
                        modifiersClassNames={{
                            selected: "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black",
                            booked: "bg-gray-100 text-gray-400 line-through dark:bg-zinc-800 dark:text-zinc-600",
                            blocked: "bg-red-50 text-red-500 font-medium dark:bg-red-900/10 dark:text-red-400"
                        }}
                        styles={{
                            day: { borderRadius: '50%' }
                        }}
                    />
                </div>

                <div className="flex-1 flex flex-col justify-center gap-4">
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800"></span>
                            <span className="text-gray-600 dark:text-gray-400">Bloqueado por ti</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"></span>
                            <span className="text-gray-600 dark:text-gray-400">Reservado</span>
                        </div>
                    </div>

                    {range?.from && (
                        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800">
                            <p className="font-medium mb-2 dark:text-white">
                                {format(range.from, 'dd MMM')}
                                {range.to && ` - ${format(range.to, 'dd MMM')}`}
                            </p>

                            {selectionStatus === 'has_booking' && (
                                <p className="text-sm text-yellow-600 dark:text-yellow-500 mb-2">
                                    ⚠️ Estas fechas incluyen una reserva confirmada y no se pueden bloquear.
                                </p>
                            )}

                            {selectionStatus === 'has_block' && (
                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                                    ℹ️ Estas fechas ya están bloqueadas. Puedes desbloquearlas a continuación.
                                </p>
                            )}

                            <div className="flex gap-2">
                                {selectionStatus === 'free' && (
                                    <button
                                        onClick={handleBlock}
                                        disabled={isPending}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isPending ? 'Procesando...' : 'Bloquear Fechas'}
                                    </button>
                                )}

                                {selectionStatus === 'has_block' && (
                                    <button
                                        onClick={handleUnblock}
                                        disabled={isPending}
                                        className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isPending ? 'Procesando...' : 'Desbloquear'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {message && (
                        <p className="text-sm text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-top-1">
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
