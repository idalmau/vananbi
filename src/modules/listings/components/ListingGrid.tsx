
import { Listing } from '@/modules/listings/types'
import { ListingCard } from './ListingCard'

interface ListingGridProps {
    listings: Listing[]
}

export function ListingGrid({ listings }: ListingGridProps) {
    return (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
            ))}
        </div>
    )
}

export function ListingGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-zinc-800 rounded-xl aspect-square w-full"></div>
                    <div className="mt-4 h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4"></div>
                    <div className="mt-2 h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2"></div>
                </div>
            ))}
        </div>
    )
}
