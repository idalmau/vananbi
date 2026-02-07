'use client'

import dynamic from 'next/dynamic'
import { Listing } from '@/modules/listings/types'

const Map = dynamic(() => import('@/shared/components/Map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 dark:bg-zinc-800 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Cargando mapa...</div>
})

export function ListingMap({ listing }: { listing: Listing }) {
    // Default center to listing location or Madrid if missing
    const center: [number, number] = [listing.latitude || 40.4168, listing.longitude || -3.7038]

    return (
        <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 z-0 relative">
            <Map listings={[listing]} center={center} zoom={13} />
        </div>
    )
}
