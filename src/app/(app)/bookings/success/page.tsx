
import Link from 'next/link'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function BookingSuccessPage({ searchParams }: { searchParams: Promise<{ id: string }> }) {
    const { id } = await searchParams
    const supabase = await createClient()

    const { data: booking } = await supabase
        .from('bookings')
        .select('*, listing:listings(title, location, image_url)')
        .eq('id', id)
        .single()

    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-4">
                <p className="text-gray-500">Reserva no encontrada.</p>
                <Link href="/" className="text-black underline mt-4 font-medium">Volver al inicio</Link>
            </div>
        )
    }

    const isCancelled = booking.status === 'cancelled'
    const isPending = booking.status === 'pending'
    const isRejected = booking.status === 'rejected'

    // Safely access listing details
    const listing = Array.isArray(booking.listing) ? booking.listing[0] : booking.listing
    const title = listing?.title || 'Vehículo'
    const location = listing?.location || 'Ubicación desconocida'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center border border-gray-100 dark:border-zinc-800">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 ${isCancelled || isRejected ? 'bg-red-100 dark:bg-red-900/30' : isPending ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                    {isCancelled || isRejected ? (
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                    ) : isPending ? (
                        <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
                    ) : (
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isCancelled ? 'Reserva Cancelada' : isRejected ? 'Reserva Rechazada' : isPending ? 'Solicitud Enviada' : '¡Todo listo!'}
                </h1>

                <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
                    {isCancelled || isRejected
                        ? 'Esta reserva no es válida.'
                        : isPending
                            ? 'El anfitrión tiene 24 horas para responder.'
                            : 'Tu aventura está confirmada.'}
                </p>

                {/* Trip Summary Card */}
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-8 text-left border border-gray-100 dark:border-zinc-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{location}</p>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Fechas</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">
                                {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total</span>
                            <span className="font-medium text-gray-900 dark:text-gray-200">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(booking.total_price / 100)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/trips"
                        className="block w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
                    >
                        Ver mis viajes
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
