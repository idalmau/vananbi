
import Image from 'next/image'
import Link from 'next/link'
import { Listing } from '@/modules/listings/types'

interface ListingCardProps {
    listing: Listing
}

export function ListingCard({ listing }: ListingCardProps) {
    // Format price from cents to dollars
    const price = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
    }).format(listing.price_per_night / 100)

    return (
        <Link href={`/listings/${listing.id}`} className="group block">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-200">
                {listing.image_url ? (
                    <Image
                        src={listing.image_url}
                        alt={listing.title}
                        fill
                        className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                        Sin Imagen
                    </div>
                )}
            </div>
            <div className="mt-4 flex justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {listing.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{listing.location}</p>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{price} <span className="font-normal text-gray-500">/noche</span></p>
            </div>
        </Link>
    )
}
