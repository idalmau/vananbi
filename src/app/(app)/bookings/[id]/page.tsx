import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import { BookingChat } from '@/modules/chat/components/BookingChat'
import { BookingActions } from '@/modules/booking/components/BookingActions'
import { CancelBookingButton } from '@/modules/booking/components/CancelBookingButton'
import { ReviewButton } from '@/modules/reviews/components/ReviewButton'
import Image from 'next/image'

export default async function BookingDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { id } = await params
    const { openChat } = await searchParams
    const startOpen = openChat === 'true'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Booking Details + Listing + Host + Guest + Messages
    const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
            *,
            listing:listings (
                id, title, location, image_url, price_per_night, host_id,
                host:profiles!listings_host_id_fkey (*)
            ),
            guest:profiles!bookings_user_id_fkey (*)
        `)
        .eq('id', id)
        .single()

    if (error || !booking) {
        console.error('Error fetching booking details:', error)
        notFound()
    }

    // Security Check: User must be Guest OR Host
    const isGuest = booking.user_id === user.id
    const isHost = booking.listing.host_id === user.id

    if (!isGuest && !isHost) {
        notFound() // Or redirect to 403
    }

    // Fetch Messages
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: true })

    const otherPartyName = isGuest
        ? (booking.listing.host?.first_name || 'Anfitrión')
        : (booking.guest?.first_name || 'Huésped')

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detalles de la Reserva</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Reserva #{booking.id.slice(0, 8)}{isGuest && ` • Viajas a ${booking.listing.location}`}
                    </p>
                </div>

                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Booking Summary */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="h-48 w-full md:w-64 relative bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                {booking.listing.image_url && (
                                    <Image src={booking.listing.image_url} alt={booking.listing.title} fill className="object-cover" />
                                )}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{booking.listing.title}</h3>
                                    {!(booking.status === 'confirmed' && new Date(booking.end_date) < new Date()) && (
                                        <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full 
                                            ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {booking.status === 'confirmed' ? 'Confirmada' :
                                                booking.status === 'rejected' ? 'Rechazada' :
                                                    booking.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                        <p className="text-gray-500 mb-1">Entrada</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{new Date(booking.start_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                        <p className="text-gray-500 mb-1">Salida</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{new Date(booking.end_date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div>
                                        <p className="text-gray-500 text-sm">Precio Total</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(booking.total_price / 100)}
                                        </p>
                                    </div>

                                    {isHost && booking.status === 'pending' && (
                                        <div className="flex items-center">
                                            <BookingActions bookingId={booking.id} status={booking.status} />
                                        </div>
                                    )}

                                    {isGuest && (booking.status === 'pending' || booking.status === 'confirmed') && (
                                        (() => {
                                            const today = new Date()
                                            today.setHours(0, 0, 0, 0)
                                            const startDate = new Date(booking.start_date)
                                            const endDate = new Date(booking.end_date)
                                            const timeDiff = startDate.getTime() - today.getTime()
                                            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

                                            // Cancellation Logic
                                            const policyDays = booking.listing.cancellation_policy_days || 7
                                            const isPenalty = daysDiff < policyDays
                                            const isTooLate = daysDiff <= 0

                                            // Review Logic
                                            // Check if we can review: Past end date & Confirmed & No review yet
                                            // Note: We need to know if review exists.
                                            // For now, let's assume if it's past and confirmed, show button.
                                            // Ideally, we should fetch review status.
                                            // But standard is mostly to allow cancel if upcoming.

                                            if (!isTooLate && booking.status !== 'confirmed') {
                                                // Pending cancellation
                                                return (
                                                    <div className="flex flex-col items-end pt-4 gap-2">
                                                        <CancelBookingButton bookingId={booking.id} />
                                                    </div>
                                                )
                                            }

                                            if (!isTooLate && booking.status === 'confirmed') {
                                                return (
                                                    <div className="flex flex-col items-end pt-4 gap-2">
                                                        {isPenalty && (
                                                            <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                                                                ⚠️ Cancelación tardía: Se aplicará cargo completo.
                                                            </span>
                                                        )}
                                                        <CancelBookingButton bookingId={booking.id} />
                                                    </div>
                                                )
                                            }

                                            return null
                                        })()
                                    )}

                                    {/* Review Button for Past Bookings */}
                                    {isGuest && booking.status === 'confirmed' && new Date(booking.end_date) < new Date() && (
                                        <div className="pt-4">
                                            <ReviewButton
                                                bookingId={booking.id}
                                                listingId={booking.listing.id}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Profile */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {isGuest ? 'Tu Anfitrión' : 'Tu Huésped'}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden">
                                <Image
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isGuest ? booking.listing.host_id : booking.user_id}`}
                                    alt="User"
                                    width={64}
                                    height={64}
                                    unoptimized
                                />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{otherPartyName}</p>
                                <p className="text-sm text-gray-500">En Vananbi desde 2024</p>
                            </div>
                        </div>
                    </div>
                </div>

                <BookingChat
                    bookingId={booking.id}
                    initialMessages={messages || []}
                    currentUserId={user.id}
                    startOpen={startOpen}
                />
            </div>
        </div>
    )
}
