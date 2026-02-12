
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
import { SortableHeader } from '@/shared/components/SortableHeader'
import { SortBy, SortOrder } from '@/modules/booking/service'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Await params
    const resolvedParams = await searchParams
    const viewParam = resolvedParams.view as string
    const pageParam = resolvedParams.page as string
    const limitParam = resolvedParams.limit as string
    const sortParam = resolvedParams.sort as string
    const orderParam = resolvedParams.order as string
    const tabParam = resolvedParams.tab as string

    // Parsing params
    const currentView = (['analytics', 'listings', 'vehicles', 'bookings'].includes(viewParam)) ? viewParam : 'analytics'
    const page = typeof pageParam === 'string' ? parseInt(pageParam) : 1
    const limit = typeof limitParam === 'string' ? parseInt(limitParam) : 10
    const sort = (typeof sortParam === 'string' && ['updated_at', 'created_at', 'start_date'].includes(sortParam)) ? sortParam as SortBy : 'updated_at'
    const order = (typeof orderParam === 'string' && ['asc', 'desc'].includes(orderParam)) ? orderParam as SortOrder : 'desc'
    const currentTab = (typeof tabParam === 'string' && ['active', 'drafts', 'past'].includes(tabParam)) ? tabParam : 'active'

    const isHost = user.user_metadata?.role === 'host'

    // Data Fetching based on View
    const allHostListings = isHost ? await getHostListings(user.id) : []

    // Analytics Data
    const hostMetrics = (isHost && currentView === 'analytics') ? await getHostMetrics(user.id) : null

    // Bookings Data
    const hostReservations = (isHost && currentView === 'bookings')
        ? await getHostBookings(user.id, page, limit, sort, order)
        : { data: [], total: 0, totalPages: 0 }

    // Listings Data
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filteredListings = allHostListings.filter(l => {
        if (currentView !== 'listings') return false
        if (currentTab === 'drafts') return l.status === 'draft'
        const availableTo = l.available_to ? new Date(l.available_to) : null
        const isExpired = availableTo && availableTo < today
        if (currentTab === 'past') return l.status === 'published' && isExpired

        // Active (default)
        return l.status === 'published' && !isExpired
    })

    // Vehicles Data
    let hostVans: any[] = []
    if (isHost && currentView === 'vehicles') {
        const { getHostVans } = await import('@/modules/vans/actions')
        hostVans = await getHostVans(user.id)
    }

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
                    {isHost && (
                        <div className="flex gap-2">
                            <Link
                                href="/vans/create"
                                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
                            >
                                + Registrar Vehículo
                            </Link>
                            <Link
                                href="/listings/create"
                                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                            >
                                + Crear Anuncio
                            </Link>
                        </div>
                    )}
                </div>

                {/* Main Tabs */}
                {isHost && (
                    <div className="border-b border-gray-200 dark:border-zinc-800 mb-8">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {[
                                { id: 'analytics', name: 'Analíticas' },
                                { id: 'listings', name: 'Mis Anuncios' },
                                { id: 'vehicles', name: 'Mis Vehículos' },
                                { id: 'bookings', name: 'Reservas' },
                            ].map((tab) => {
                                const isActive = currentView === tab.id
                                return (
                                    <Link
                                        key={tab.id}
                                        href={`/dashboard?view=${tab.id}`}
                                        className={`
                                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                            ${isActive
                                                ? 'border-black text-black dark:border-white dark:text-white'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                            }
                                        `}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        {tab.name}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                )}

                <div className="space-y-12">
                    {/* HOST AREA ONLY */}
                    {isHost ? (
                        <>
                            {/* VIEW: ANALYTICS */}
                            {currentView === 'analytics' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    {hostMetrics && <StatsCards metrics={hostMetrics} />}
                                    <BookingTrends listings={allHostListings} hostId={user.id} />
                                </div>
                            )}

                            {/* VIEW: LISTINGS */}
                            {currentView === 'listings' && (
                                <section className="animate-in fade-in duration-500">
                                    <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                                        {['active', 'drafts', 'past'].map((tab) => {
                                            const labels: any = { active: 'Activos', drafts: 'Borradores', past: 'Pasados' }
                                            const isActive = currentTab === tab
                                            return (
                                                <Link
                                                    key={tab}
                                                    href={`/dashboard?view=listings&tab=${tab}`}
                                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                                        ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                                        }`}
                                                >
                                                    {labels[tab]}
                                                </Link>
                                            )
                                        })}
                                    </div>

                                    {filteredListings.length === 0 ? (
                                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 text-center border border-dashed border-gray-300 dark:border-zinc-700">
                                            <p className="text-gray-500 mb-2">No hay anuncios en esta sección.</p>
                                            {currentTab === 'active' && <p className="text-sm text-gray-400">Publica un borrador para verlo aquí.</p>}
                                        </div>
                                    ) : (
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {filteredListings.map((listing: any) => (
                                                <Link href={`/listings/${listing.id}`} key={listing.id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 flex gap-4 p-4 hover:shadow-md transition-shadow group relative">
                                                    <div className="h-20 w-20 relative bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                                        {listing.image_url && <Image src={listing.image_url} alt={listing.title} fill className="object-cover" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{listing.title}</h3>
                                                        <p className="text-xs text-gray-500 truncate">{listing.location}</p>
                                                        <div className="mt-2 flex items-center justify-between">
                                                            <span className="text-sm font-medium">
                                                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(listing.price_per_night / 100)} / noche
                                                            </span>
                                                            {currentTab === 'drafts' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Borrador</span>}
                                                            {currentTab === 'past' && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">Expirado</span>}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* VIEW: VEHICLES */}
                            {currentView === 'vehicles' && (
                                <section className="animate-in fade-in duration-500">
                                    {hostVans.length === 0 ? (
                                        <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 text-center border border-dashed border-gray-300 dark:border-zinc-700">
                                            <p className="text-gray-500 mb-2">No tienes vehículos registrados.</p>
                                            <Link href="/vans/create" className="text-blue-600 hover:underline text-sm">Registra tu primer vehículo</Link>
                                        </div>
                                    ) : (
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {hostVans.map((van) => (
                                                <div key={van.id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 dark:text-white">{van.make} {van.model}</h3>
                                                            <p className="text-xs text-gray-500">{van.license_plate}</p>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium 
                                                            ${van.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                van.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                            {van.status === 'approved' ? 'Aprobado' : van.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-2">
                                                        Registrado el {new Date(van.created_at).toLocaleDateString()}
                                                    </div>
                                                    {van.status === 'rejected' && (
                                                        <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">Motivo: {van.rejection_reason}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* VIEW: BOOKINGS */}
                            {currentView === 'bookings' && (
                                <section className="animate-in fade-in duration-500">
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

                                                            <SortableHeader
                                                                label="Fechas"
                                                                value="start_date"
                                                                currentSort={sort}
                                                                currentOrder={order}
                                                            />

                                                            <SortableHeader
                                                                label="Actualizado"
                                                                value="updated_at"
                                                                currentSort={sort}
                                                                currentOrder={order}
                                                            />

                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                                                        {hostReservations.data.map((res: any) => (
                                                            <tr key={res.id}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                                    <Link href={`/bookings/${res.id}`} className="hover:text-blue-600 hover:underline transition-colors">
                                                                        {res.listing.title}
                                                                    </Link>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {res.guest?.first_name && res.guest?.last_name
                                                                        ? `${res.guest.first_name} ${res.guest.last_name}`
                                                                        : res.guest?.email || 'Usuario'}
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
                                                                    <div className="flex flex-col">
                                                                        <span>{new Date(res.updated_at).toLocaleDateString()}</span>
                                                                        <span className="text-xs text-gray-400">{new Date(res.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
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
                            )}
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
