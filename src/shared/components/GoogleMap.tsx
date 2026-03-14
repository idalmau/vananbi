'use client'
import { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface MapProps {
    listings: any[]
    center?: [number, number]
    zoom?: number
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export const GoogleMap = ({ listings, center = [40.4168, -3.7038], zoom = 6, onFallback }: MapProps & { onFallback: () => void }) => {
    const mapDivRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<google.maps.Map | null>(null)

    useEffect(() => {
        if (!GOOGLE_MAPS_API_KEY) {
            onFallback()
            return
        }

        const loader = new Loader({
            apiKey: GOOGLE_MAPS_API_KEY,
            version: "weekly",
        })

        ;(loader as any).importLibrary("maps").then(() => {
            if (mapDivRef.current && !mapRef.current) {
                const googleMap = new google.maps.Map(mapDivRef.current, {
                    center: { lat: center[0], lng: center[1] },
                    zoom: zoom,
                    mapId: "DEMO_MAP_ID", 
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                })
                
                mapRef.current = googleMap

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
