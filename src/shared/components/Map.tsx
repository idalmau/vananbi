/// <reference types="google.maps" />
'use client'
import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import Image from 'next/image'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

// Environment variables
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const DEFAULT_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'google'

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

// --- Leaflet Implementation (Fallback) ---
const LeafletMap = ({ listings, center = [40.4168, -3.7038], zoom = 6 }: MapProps) => {
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

// Extracted Popup Content for reuse if needed (though Google Maps API handles HTML strings/DOM nodes differently)
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

// --- Google Map Implementation ---
const GoogleMap = ({ listings, center = [40.4168, -3.7038], zoom = 6, onFallback }: MapProps & { onFallback: () => void }) => {
    const mapDivRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<google.maps.Map | null>(null)

    useEffect(() => {
        if (!GOOGLE_MAPS_API_KEY) {
            onFallback()
            return
        }

        setOptions({
            key: GOOGLE_MAPS_API_KEY,
            v: "weekly",
        })

        importLibrary("maps").then(() => {
            if (mapDivRef.current && !mapRef.current) {
                const googleMap = new google.maps.Map(mapDivRef.current, {
                    center: { lat: center[0], lng: center[1] },
                    zoom: zoom,
                    mapId: "DEMO_MAP_ID", // Required for Advanced Markers if we used them, but good practice
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                })

                // Add Markers
                listings.forEach(listing => {
                    if (listing.latitude && listing.longitude) {
                        const marker = new google.maps.Marker({
                            position: { lat: listing.latitude, lng: listing.longitude },
                            map: googleMap,
                            title: listing.title,
                        })

                        const infoWindow = new google.maps.InfoWindow({
                            content: `
                                <div style="min-width: 200px; font-family: sans-serif;">
                                    <h3 style="font-weight: bold; margin-bottom: 4px;">${listing.title}</h3>
                                    <p style="color: #666; font-size: 12px; margin-bottom: 8px;">${listing.location}</p>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-weight: 600;">
                                            ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(listing.price_per_night / 100)}
                                            <span style="font-weight: 400; color: #666; font-size: 12px;">/noche</span>
                                        </span>
                                        <a href="/listings/${listing.id}" style="text-decoration: none; color: #000; border: 1px solid #ccc; padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #fff;">Ver</a>
                                    </div>
                                </div>
                            `
                            // Note: Next.js Image optimization won't work easily inside GMaps InfoWindow string 
                            // as it's outside React tree. We skipped the image for simplicity in MVP Google view 
                            // to avoid complexity with ReactDOM.render/createRoot inside InfoWindow.
                        })

                        marker.addListener("click", () => {
                            infoWindow.open({
                                anchor: marker,
                                map: googleMap,
                            })
                        })
                    }
                })
            }
        }).catch((e: any) => {
            console.error("Failed to load Google Maps:", e)
            onFallback()
        })
    }, [center, zoom, listings, onFallback])

    return <div ref={mapDivRef} className="h-full w-full rounded-xl" />
}

// --- Main Switcher Component ---
const Map = (props: MapProps) => {
    const [provider, setProvider] = useState<'google' | 'osm'>(DEFAULT_PROVIDER === 'google' && GOOGLE_MAPS_API_KEY ? 'google' : 'osm')

    // Listen for global auth failures
    useEffect(() => {
        const handleFailure = () => setProvider('osm')
        if (typeof window !== 'undefined') {
            window.addEventListener('google-maps-failure', handleFailure)
        }
        return () => {
            if (typeof window !== 'undefined') window.removeEventListener('google-maps-failure', handleFailure)
        }
    }, [])

    if (provider === 'google') {
        return <GoogleMap {...props} onFallback={() => setProvider('osm')} />
    }

    return <LeafletMap {...props} />
}

export default Map
