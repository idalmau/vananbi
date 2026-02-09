'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CancelBookingButton } from './CancelBookingButton'
import { ReviewForm } from '@/modules/reviews/components/ReviewForm'

interface Booking {
    id: string
    start_date: string
    end_date: string
    status: 'confirmed' | 'pending' | 'cancelled' | 'rejected'
    listing: {
        id: string
        title: string
        image_url: string | null
    }
    reviews?: { id: string }[]
}

export function BookingList({ bookings }: { bookings: Booking[] }) {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')
    const [reviewBooking, setReviewBooking] = useState<Booking | null>(null)

    const now = new Date()

    const filteredBookings = bookings.filter(b => {
        const endDate = new Date(b.end_date)
        const isPast = endDate < now

        if (activeTab === 'upcoming') {
            return (b.status === 'confirmed' || b.status === 'pending') && !isPast
        }
        if (activeTab === 'past') {
            return b.status === 'confirmed' && isPast
        }
        if (activeTab === 'cancelled') {
            return b.status === 'cancelled' || b.status === 'rejected'
        }
        return false
    })

    const canReview = (booking: Booking) => {
        if (booking.status !== 'confirmed') return false
        const endDate = new Date(booking.end_date)
        // Allow review if end date is in the past AND no review exists
        return endDate < now && (!booking.reviews || booking.reviews.length === 0)
    }

    return (
        <section>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-zinc-800 pb-1">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-1.5 ${activeTab === 'upcoming'
                            ? 'border-black text-black dark:border-white dark:text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    Próximos
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-1.5 ${activeTab === 'past'
                            ? 'border-black text-black dark:border-white dark:text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    Pasados
                </button>
                <button
                    onClick={() => setActiveTab('cancelled')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-1.5 ${activeTab === 'cancelled'
                            ? 'border-black text-black dark:border-white dark:text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    Cancelados
                </button>
            </div>

            {filteredBookings.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-gray-200 dark:border-zinc-800">
                    <p className="text-gray-500 mb-4">
                        {activeTab === 'upcoming' ? 'No tienes viajes próximos.' :
                            activeTab === 'past' ? 'No tienes viajes pasados.' :
                                'No tienes viajes cancelados.'}
                    </p>
                    {activeTab === 'upcoming' && (
                        <Link href="/search" className="text-blue-600 font-medium hover:underline">Buscar una van</Link>
                    )}
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

                                    {canReview(booking) && (
                                        <button
                                            onClick={() => setReviewBooking(booking)}
                                            className="px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                                        >
                                            Valorar
                                        </button>
                                    )}

                                    {!canReview(booking) && booking.status !== 'cancelled' && booking.status !== 'rejected' && !((new Date(booking.end_date)) < now) && (
                                        <CancelBookingButton bookingId={booking.id} />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {reviewBooking && (
                <ReviewForm
                    bookingId={reviewBooking.id}
                    listingId={reviewBooking.listing.id}
                    onClose={() => setReviewBooking(null)}
                />
            )}
        </section>
    )
}
