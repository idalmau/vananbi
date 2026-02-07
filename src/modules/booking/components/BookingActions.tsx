'use client'

import { useState } from 'react'
import { confirmBooking, rejectBooking } from '@/modules/booking/actions'

interface BookingActionsProps {
    bookingId: string
    status: string
}

export function BookingActions({ bookingId, status }: BookingActionsProps) {
    const [isLoading, setIsLoading] = useState(false)

    if (status !== 'pending') {
        return null
    }

    const handleConfirm = async () => {
        if (!confirm('¿Estás seguro de que quieres aceptar esta reserva?')) return
        setIsLoading(true)
        try {
            const res = await confirmBooking(bookingId)
            if (res.error) alert(res.error)
        } catch (e) {
            console.error(e)
            alert('Error al procesar la solicitud')
        } finally {
            setIsLoading(false)
        }
    }

    const handleReject = async () => {
        if (!confirm('¿Estás seguro de que quieres rechazar esta reserva?')) return
        setIsLoading(true)
        try {
            const res = await rejectBooking(bookingId)
            if (res.error) alert(res.error)
        } catch (e) {
            console.error(e)
            alert('Error al procesar la solicitud')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
                {isLoading ? '...' : 'Aceptar'}
            </button>
            <button
                onClick={handleReject}
                disabled={isLoading}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
                {isLoading ? '...' : 'Rechazar'}
            </button>
        </div>
    )
}
