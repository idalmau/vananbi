'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ListingGrid } from '@/modules/listings/components/ListingGrid'
import { Listing } from '@/modules/listings/types'

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/shared/components/Map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">Cargando mapa...</div>
})

interface SearchLayoutProps {
    listings: Listing[]
}

export function SearchLayout({ listings }: SearchLayoutProps) {
    const [showMap, setShowMap] = useState(false)

    return (
        <div className="flex flex-col h-full">
            {/* Mobile Toggle */}
            <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={() => setShowMap(!showMap)}
                    className="bg-black text-white px-6 py-3 rounded-full shadow-lg font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors"
                >
                    {showMap ? 'Mostrar Lista' : 'Mostrar Mapa'}
                </button>
            </div>

            <div className="flex-1 flex lg:gap-8">
                {/* Listings List */}
                <div className={`
                    w-full lg:w-3/5 pb-20 lg:pb-0 px-4 lg:px-0
                    ${showMap ? 'hidden lg:block' : 'block'}
                `}>
                    <div className="mb-6 flex justify-between items-end">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {listings.length} {listings.length === 1 ? 'alojamiento' : 'alojamientos'} encontrados
                        </h1>
                    </div>

                    <ListingGrid listings={listings} />
                </div>

                {/* Map Container */}
                <div className={`
                    w-full lg:w-2/5 h-[calc(100vh-100px)] sticky top-24 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800
                    ${showMap ? 'block fixed inset-0 z-40 bg-white lg:static lg:h-[calc(100vh-140px)]' : 'hidden lg:block'}
                `}>
                    {/* Close button for Mobile Map view */}
                    {showMap && (
                        <button
                            onClick={() => setShowMap(false)}
                            className="lg:hidden absolute top-4 left-4 z-[401] bg-white p-2 rounded-full shadow-md"
                        >
                            ✕
                        </button>
                    )}
                    <Map listings={listings} />
                </div>
            </div>
        </div>
    )
}
