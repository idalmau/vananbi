
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import { getUserBookings, getHostBookings } from '@/modules/booking/service'
import { getHostListings } from '@/modules/listings/service'
import { CancelBookingButton } from '@/modules/booking/components/CancelBookingButton'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const isHost = user.user_metadata?.role === 'host'

    const myBookings = await getUserBookings(user.id)
    const hostListings = isHost ? await getHostListings(user.id) : []
    const hostReservations = isHost ? await getHostBookings(user.id) : []

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
                    {isHost && (
                        <Link
                            href="/listings/create"
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        >
                            + Crear Anuncio
                        </Link>
                    )}
                </div>

                <div className="space-y-12">
                    {/* SECTION 1: My Trips (As a Guest) */}
                    {!isHost && (
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mis Viajes</h2>
                            {myBookings.length === 0 ? (
                                <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-gray-200 dark:border-zinc-800">
                                    <p className="text-gray-500 mb-4">No tienes viajes planeados todavía.</p>
                                    <Link href="/search" className="text-blue-600 font-medium hover:underline">Buscar una van</Link>
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {myBookings.map((booking: any) => (
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
                                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {booking.status === 'confirmed' ? 'Confirmado' : booking.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-4">{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</p>
                                                <div className="flex gap-2 items-center">
                                                    <Link href={`/bookings/success?id=${booking.id}`} className="flex-1 text-center text-sm border border-gray-300 rounded-lg py-2 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
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
                    )}

                    {/* SECTION 2: HOST AREA */}
                    {isHost && (
                        <>
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mis Anuncios</h2>
                                {hostListings.length === 0 ? (
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-gray-200 dark:border-zinc-800">
                                        <p className="text-gray-500">No has publicado ningún anuncio.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {hostListings.map((listing: any) => (
                                            <div key={listing.id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 flex gap-4 p-4">
                                                <div className="h-20 w-20 relative bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                    {listing.image_url && <Image src={listing.image_url} alt={listing.title} fill className="object-cover" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{listing.title}</h3>
                                                    <p className="text-xs text-gray-500">{listing.location}</p>
                                                    <div className="mt-2 text-sm font-medium">
                                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(listing.price_per_night / 100)} / noche
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Reservas Recibidas</h2>
                                {hostReservations.length === 0 ? (
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-gray-200 dark:border-zinc-800">
                                        <p className="text-gray-500">Aún no tienes reservas en tus vehículos.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                                                <thead className="bg-gray-50 dark:bg-zinc-950">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Huésped</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                                                    {hostReservations.map((res: any) => (
                                                        <tr key={res.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                                {res.listing.title}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {res.guest?.first_name} {res.guest?.last_name}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {new Date(res.start_date).toLocaleDateString()} → {new Date(res.end_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(res.total_price / 100)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    {res.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
