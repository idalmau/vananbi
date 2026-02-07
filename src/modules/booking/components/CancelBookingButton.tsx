'use client'

import { useActionState } from 'react'
import { cancelBooking } from '@/modules/booking/actions'

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
    // We bind the bookingId to the action so we don't need a hidden input
    const cancelWithId = cancelBooking.bind(null, bookingId)

    // useActionState allows us to see the result/error
    const [state, formAction, isPending] = useActionState(async () => {
        return cancelWithId()
    }, null)

    return (
        <form action={formAction}>
            <button
                type="submit"
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 active:scale-95 transition-transform"
            >
                {isPending ? 'Cancelando...' : 'Cancelar'}
            </button>
            {state?.error && <p className="text-xs text-red-500 mt-1">{state.error}</p>}
        </form>
    )
}
