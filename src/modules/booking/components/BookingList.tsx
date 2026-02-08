'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CancelBookingButton } from './CancelBookingButton'

interface Booking {
    id: string
    start_date: string
    end_date: string
    status: 'confirmed' | 'pending' | 'cancelled' | 'rejected'
    listing: {
        title: string
        image_url: string | null
    }
}

export function BookingList({ bookings }: { bookings: Booking[] }) {
    const [showCancelled, setShowCancelled] = useState(false)

    const hasCancelledBookings = bookings.some(b => b.status === 'cancelled')

    const filteredBookings = bookings.filter(b =>
        showCancelled
            ? b.status === 'cancelled'
            : b.status !== 'cancelled'
    )

    return (
        <section>
            <div className="flex justify-end items-center mb-4">
                {hasCancelledBookings && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="showCancelled" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                            Mostrar cancelados
                        </label>
                        <button
                            id="showCancelled"
                            role="switch"
                            aria-checked={showCancelled}
                            onClick={() => setShowCancelled(!showCancelled)}
                            className={`
                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                ${showCancelled ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}
                            `}
                        >
                            <span
                                className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                    ${showCancelled ? 'translate-x-6 dark:bg-black' : 'translate-x-1'}
                                `}
                            />
                        </button>
                    </div>
                )}
            </div>

            {filteredBookings.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-gray-200 dark:border-zinc-800">
                    <p className="text-gray-500 mb-4">
                        {bookings.length > 0 ? 'No hay viajes activos visible.' : 'No tienes viajes planeados todavía.'}
                    </p>
                    <Link href="/search" className="text-blue-600 font-medium hover:underline">Buscar una van</Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBookings.map((booking) => (
                        <div key={booking.id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 group hover:shadow-md transition-shadow">
                            <div className="relative h-40 bg-gray-200">
                                {booking.listing.image_url ? (
                                    <Image src={booking.listing.image_url} alt={booking.listing.title} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">Sin Imagen</div>
                                )}
                            </div>

                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{booking.listing.title}</h3>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            booking.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {booking.status === 'confirmed' ? 'Confirmado' :
                                            booking.status === 'rejected' ? 'Rechazada' :
                                                booking.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    {new Date(booking.start_date).toLocaleDateString('es-ES')} - {new Date(booking.end_date).toLocaleDateString('es-ES')}
                                </p>
                                <div className="flex gap-2 items-center">
                                    <Link
                                        href={`/bookings/${booking.id}`}
                                        className="flex-1 text-center text-sm border border-gray-300 rounded-lg py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800 active:scale-95 transition-transform"
                                    >
                                        Ver Detalles
                                    </Link>
                                    {booking.status !== 'cancelled' && (
                                        <CancelBookingButton bookingId={booking.id} />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
