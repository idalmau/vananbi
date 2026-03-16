
import { Suspense } from 'react'
import { getListings } from '@/modules/listings/service'
import { ListingGrid, ListingGridSkeleton } from '@/modules/listings/components/ListingGrid'
import { SearchLayout } from './components/SearchLayout'
import { SearchFilters } from './components/SearchFilters'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const query = typeof params.destination === 'string' ? params.destination : undefined
    
    // Parse comma-separated strings into arrays
    const vehicle_type_param = typeof params.vehicle_type === 'string' ? params.vehicle_type : undefined
    const vehicleType = vehicle_type_param ? vehicle_type_param.split(',') : undefined
    
    const handover_method_param = typeof params.handover_method === 'string' ? params.handover_method : undefined
    const handoverMethod = handover_method_param ? handover_method_param.split(',') : undefined

    const listings = await getListings({ query, vehicleType, handoverMethod })

    return (
        <div className="bg-white dark:bg-black">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <Suspense>
                    <SearchFilters />
                </Suspense>

                {listings.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500 dark:text-gray-400">
                            No se encontraron alojamientos{query ? ` para "${query}"` : ''}.
                        </p>
                        <p className="mt-2 text-gray-400">Intenta con otra ubicación o ajusta los filtros.</p>
                    </div>
                ) : (
                    <SearchLayout listings={listings} />
                )}
            </div>
        </div>
    )
}

