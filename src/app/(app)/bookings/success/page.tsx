
import Link from 'next/link'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function BookingSuccessPage({ searchParams }: { searchParams: Promise<{ id: string }> }) {
    const { id } = await searchParams
    const supabase = await createClient()

    const { data: booking } = await supabase
        .from('bookings')
        .select('status, total_price, listing:listings(title)')
        .eq('id', id)
        .single()

    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-4">
                <p>Reserva no encontrada.</p>
                <Link href="/dashboard" className="text-blue-500 underline mt-4">Volver al panel</Link>
            </div>
        )
    }

    const isCancelled = booking.status === 'cancelled'
    const isPending = booking.status === 'pending'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center border border-gray-100 dark:border-zinc-800">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 ${isCancelled ? 'bg-red-100 dark:bg-red-900/30' : isPending ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                    {isCancelled ? (
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                    ) : isPending ? (
                        <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
                    ) : (
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isCancelled ? 'Reserva Cancelada' : isPending ? 'Solicitud Pendiente' : '¡Reserva Confirmada!'}
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">
                    {booking.listing.title}
                </p>

                <p className="text-gray-500 dark:text-gray-500 mb-8 text-sm">
                    {isCancelled
                        ? 'Esta reserva ha sido cancelada y no tendrá validez.'
                        : 'Tu reserva ha sido procesada correctamente.'}
                </p>

                <div className="space-y-3">
                    <Link
                        href="/dashboard"
                        className="block w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
                    >
                        Ir al Panel
                    </Link>
                    <Link
                        href="/search"
                        className="block w-full py-3 px-4 text-gray-700 font-medium hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        Buscar más vans
                    </Link>
                </div>
            </div>
        </div>
    )
}
