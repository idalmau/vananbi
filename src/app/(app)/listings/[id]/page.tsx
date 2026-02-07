import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getListingById, getListingAvailability } from '@/modules/listings/service'
import { createClient } from '@/shared/lib/supabase/server'
import { BookingForm } from '@/modules/booking/components/BookingForm'
import { getUserBookings } from '@/modules/booking/service'

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { id } = await params
    const { startDate, endDate } = await searchParams
    const listing = await getListingById(id)
    const bookedDates = await getListingAvailability(id)

    if (!listing) {
        notFound()
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userBookings = user ? await getUserBookings(user.id) : []


    return (
        <div className="bg-white dark:bg-black min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{listing.title}</h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{listing.location}</p>
                </div>

                {/* Image Grid (Simplified for MVP: Single Image) */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-200">
                    {listing.image_url ? (
                        <Image
                            src={listing.image_url}
                            alt={listing.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            Imagen No Disponible
                        </div>
                    )}
                </div>

                {/* Content & Sidebar */}
                <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-3">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Host Info */}
                        <div className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-zinc-800">
                            <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                                <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.host_id}`} alt="Host" width={48} height={48} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Host: {listing.host?.email ? listing.host.email.split('@')[0] : 'Usuario'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Se unió en {listing.host?.created_at ? new Date(listing.host.created_at).getFullYear() : '2024'}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Acerca de este vehículo</h2>
                            <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                                {listing.description}
                            </p>
                        </div>

                        {/* Amenities */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Lo que ofrece este vehículo</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.1 6a2.5 2.5 0 0 1 1.9 4.2 2.5 2.5 0 0 1-1.9-4.2Z" /><path d="M15 11h.1" /><path d="M13.5 13.6c.9-.5 1.5-1.5 1.5-2.6a1 1 0 0 0-3 0 1 1 0 0 0-3 0c0 1.1.6 2.1 1.5 2.6" /><path d="M7 16h6" /><path d="M11 16a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h3a2 2 0 0 1 2 2Z" /></svg>
                                    <span>Cocina equipada</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20" /><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M12 5V2" /><circle cx="12" cy="7" r="2" /></svg>
                                    <span>Baño portátil</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9a4 4 0 0 0-2 7.5 M12 3v2 M6.6 18.4l1.4-1.4 M20 4v10.5a2.5 2.5 0 0 1-2.5 2.5h-11a2.5 2.5 0 0 1-2.5-2.5V4 M12 21a2 2 0 0 0 2-2" /></svg>
                                    <span>Calefacción estacionaria</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                    <span>Check-in flexible</span>
                                </div>
                            </div>
                        </div>

                        {/* Map Placeholder */}
                        <div className="h-64 rounded-xl bg-gray-100 dark:bg-zinc-900 flex items-center justify-center border border-gray-200 dark:border-zinc-800">
                            <span className="text-gray-400 font-medium">Mapa de ubicación (Próximamente)</span>
                        </div>
                    </div>

                    {/* Booking Sidebar */}
                    <div className="lg:col-span-1">
                        <BookingForm
                            listing={listing}
                            user={user}
                            bookedDates={bookedDates}
                            initialStartDate={typeof startDate === 'string' ? startDate : ''}
                            initialEndDate={typeof endDate === 'string' ? endDate : ''}
                            userBookings={userBookings}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
