
import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import { getHostBookings } from '@/modules/booking/service'
import { getHostListings } from '@/modules/listings/service'
import { getHostMetrics } from '@/modules/booking/metrics'
import { BookingActions } from '@/modules/booking/components/BookingActions'
import { StatsCards } from './components/StatsCards'
import { BookingTrends } from './components/BookingTrends'
import { Pagination } from '@/shared/components/Pagination'
import { PageSizeSelector } from '@/shared/components/PageSizeSelector'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { page: pageParam, limit: limitParam } = await searchParams
    const page = typeof pageParam === 'string' ? parseInt(pageParam) : 1
    const limit = typeof limitParam === 'string' ? parseInt(limitParam) : 10

    const isHost = user.user_metadata?.role === 'host'

    const hostListings = isHost ? await getHostListings(user.id) : []
    const hostReservations = isHost ? await getHostBookings(user.id, page, limit) : { data: [], total: 0, totalPages: 0 }
    const hostMetrics = isHost ? await getHostMetrics(user.id) : null

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
                    {/* HOST AREA ONLY */}
                    {isHost ? (
                        <>
                            {hostMetrics && <StatsCards metrics={hostMetrics} />}

                            <div className="mb-12">
                                <BookingTrends listings={hostListings} hostId={user.id} />
                            </div>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mis Anuncios</h2>
                                {hostListings.length === 0 ? (
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-gray-200 dark:border-zinc-800">
                                        <p className="text-gray-500">No has publicado ningún anuncio.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {hostListings.map((listing: any) => (
                                            <Link href={`/listings/${listing.id}`} key={listing.id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 flex gap-4 p-4 hover:shadow-md transition-shadow group">
                                                <div className="h-20 w-20 relative bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                                    {listing.image_url && <Image src={listing.image_url} alt={listing.title} fill className="object-cover" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{listing.title}</h3>
                                                    <p className="text-xs text-gray-500">{listing.location}</p>
                                                    <div className="mt-2 text-sm font-medium">
                                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(listing.price_per_night / 100)} / noche
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Reservas Recibidas</h2>
                                {hostReservations.data.length === 0 ? (
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
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chat</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                                                    {hostReservations.data.map((res: any) => (
                                                        <tr key={res.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                                {res.listing.title}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                <Link href={`/bookings/${res.id}`} className="text-blue-600 hover:underline">
                                                                    {res.guest?.first_name} {res.guest?.last_name}
                                                                </Link>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <Link href={`/bookings/${res.id}?openChat=true`} className="relative inline-block p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                                    <MessageCircle className="h-5 w-5" />
                                                                    {res.unread_count > 0 && (
                                                                        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white transform translate-x-1/4 -translate-y-1/4" />
                                                                    )}
                                                                </Link>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {new Date(res.start_date).toLocaleDateString()} → {new Date(res.end_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(res.total_price / 100)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                    ${res.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                                        res.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                            res.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                                                                'bg-yellow-100 text-yellow-800'}`}>
                                                                    {res.status === 'confirmed' ? 'Confirmada' :
                                                                        res.status === 'rejected' ? 'Rechazada' :
                                                                            res.status === 'cancelled' ? 'Cancelada' :
                                                                                'Pendiente'}
                                                                </span>
                                                                <div className="mt-2">
                                                                    <BookingActions bookingId={res.id} status={res.status} />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <PageSizeSelector currentLimit={limit} />

                                    <Pagination
                                        totalPages={hostReservations.totalPages}
                                        currentPage={page}
                                        baseUrl="/dashboard"
                                    />
                                </div>
                            </section>
                        </>
                    ) : (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-gray-200 dark:border-zinc-800">
                            <p className="text-gray-500">No tienes acceso al panel de host.</p>
                            <Link href="/trips" className="text-blue-600 hover:underline mt-2 inline-block">Ver mis viajes</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
