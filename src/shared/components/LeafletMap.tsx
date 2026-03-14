'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import Image from 'next/image'

// Fix for default marker icon missing in Leaflet + React
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface MapProps {
    listings: any[]
    center?: [number, number]
    zoom?: number
}

const ListingPopupContent = ({ listing }: { listing: any }) => (
    <div className="min-w-[200px]">
        <div className="relative h-32 w-full mb-2 rounded-lg overflow-hidden">
            {listing.image_url && <Image src={listing.image_url} alt={listing.title} fill className="object-cover" />}
        </div>
        <h3 className="font-bold text-sm mb-1">{listing.title}</h3>
        <p className="text-xs text-gray-500 mb-2">{listing.location}</p>
        <div className="flex justify-between items-center">
            <span className="font-semibold text-sm">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(listing.price_per_night / 100)}
                <span className="text-xs font-normal text-gray-500">/noche</span>
            </span>
            <Link href={`/listings/${listing.id}`} className="bg-white text-gray-900 border border-gray-200 text-xs px-3 py-1 rounded hover:bg-gray-50 font-medium">
                Ver
            </Link>
        </div>
    </div>
)

export const LeafletMap = ({ listings, center = [40.4168, -3.7038], zoom = 6 }: MapProps) => {
    return (
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full rounded-xl z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {listings.map((listing) => (
                listing.latitude && listing.longitude ? (
                    <Marker key={listing.id} position={[listing.latitude, listing.longitude]}>
                        <Popup>
                            <ListingPopupContent listing={listing} />
                        </Popup>
                    </Marker>
                ) : null
            ))}
        </MapContainer>
    )
}
