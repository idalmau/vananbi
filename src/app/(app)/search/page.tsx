
import { Suspense } from 'react'
import { getListings } from '@/modules/listings/service'
import { ListingGrid, ListingGridSkeleton } from '@/modules/listings/components/ListingGrid'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { destination } = await searchParams
    const query = typeof destination === 'string' ? destination : undefined

    const listings = await getListings(query)

    return (
        <div className="bg-white dark:bg-black">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
                    Estancias cerca de ti
                </h1>

                {listings.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500 dark:text-gray-400">
                            No se encontraron alojamientos{query ? ` para "${query}"` : ''}.
                        </p>
                        <p className="mt-2 text-gray-400">Intenta con otra ubicación o términos más generales.</p>
                    </div>
                ) : (
                    <Suspense fallback={<ListingGridSkeleton />}>
                        <ListingGrid listings={listings} />
                    </Suspense>
                )}
            </div>
        </div>
    )
}
