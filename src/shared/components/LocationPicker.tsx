/// <reference types="google.maps" />
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { Loader } from '@googlemaps/js-api-loader'

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

interface LocationPickerProps {
    initialLocation: string
    initialLat?: number
    initialLng?: number
    onLocationChange: (location: string, lat: number, lng: number) => void
}

// Global fallback handler for Google Maps auth/quota failures
if (typeof window !== 'undefined') {
    (window as any).gm_authFailure = () => {
        console.error('Google Maps Authentication/Quota Failure. Switching to OSM.')
        window.dispatchEvent(new Event('google-maps-failure'))
    }
}

// Internal Google Maps Picker Component
const GoogleMapPicker = ({
    center,
    zoom = 13,
    onMapClick
}: {
    center: [number, number],
    zoom?: number,
    onMapClick: (lat: number, lng: number) => void
}) => {
    const mapRef = useRef<HTMLDivElement>(null)
    const googleMapRef = useRef<google.maps.Map | null>(null)
    const markerRef = useRef<google.maps.Marker | null>(null)

    useEffect(() => {
        if (!mapRef.current) return

        if (!googleMapRef.current) {
            googleMapRef.current = new google.maps.Map(mapRef.current, {
                center: { lat: center[0], lng: center[1] },
                zoom: zoom,
                disableDefaultUI: false,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            })

            googleMapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
                if (e.latLng) {
                    onMapClick(e.latLng.lat(), e.latLng.lng())
                }
            })
        }
    }, []) // Initialize map once

    // Update center and marker when position changes
    useEffect(() => {
        if (googleMapRef.current) {
            googleMapRef.current.setCenter({ lat: center[0], lng: center[1] })
            // Optional: Don't flyTo/pan if user caused the move to avoid fighting, 
            // but here 'center' is the source of truth from parent.

            if (!markerRef.current) {
                markerRef.current = new google.maps.Marker({
                    map: googleMapRef.current,
                    position: { lat: center[0], lng: center[1] },
                })
            } else {
                markerRef.current.setPosition({ lat: center[0], lng: center[1] })
            }
        }
    }, [center[0], center[1]])

    return <div ref={mapRef} className="h-full w-full" />
}

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
    const map = useMap()

    // Update map center when position changes (e.g. from search)
    useEffect(() => {
        map.flyTo(position, map.getZoom())
    }, [position, map])

    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng])
        },
    })

    return position === null ? null : (
        <Marker position={position} />
    )
}

export function LocationPicker({ initialLocation, initialLat, initialLng, onLocationChange }: LocationPickerProps) {
    const [provider, setProvider] = useState<'google' | 'osm'>(DEFAULT_PROVIDER === 'google' && GOOGLE_MAPS_API_KEY ? 'google' : 'osm')
    const [googleLoaded, setGoogleLoaded] = useState(false)
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState(initialLocation || '')
    const [position, setPosition] = useState<[number, number]>(initialLat && initialLng ? [initialLat, initialLng] : [40.4168, -3.7038])
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Google Services Refs
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
    const placesService = useRef<google.maps.places.PlacesService | null>(null)
    const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
    const mapDivRef = useRef<HTMLDivElement>(null) // Hidden div for PlacesService

    // Initialize Google Maps
    useEffect(() => {
        if (provider === 'google' && GOOGLE_MAPS_API_KEY && !googleLoaded) {
            const loader = new Loader({
                apiKey: GOOGLE_MAPS_API_KEY,
                version: "weekly",
                libraries: ["places"]
            })

            ;(loader as any).importLibrary('places').then(() => {
                setGoogleLoaded(true)
                autocompleteService.current = new google.maps.places.AutocompleteService()
                sessionToken.current = new google.maps.places.AutocompleteSessionToken()
                // PlacesService requires a map or HTML element (even if hidden)
                if (mapDivRef.current) {
                    placesService.current = new google.maps.places.PlacesService(mapDivRef.current)
                }
            }).catch((e: any) => {
                console.error("Failed to load Google Maps:", e)
                switchToOSM()
            })
        }
    }, [provider, googleLoaded])

    // Listen for global auth failures
    useEffect(() => {
        const handleFailure = () => switchToOSM()
        window.addEventListener('google-maps-failure', handleFailure)
        return () => window.removeEventListener('google-maps-failure', handleFailure)
    }, [])

    const switchToOSM = useCallback(() => {
        console.log("Switching provider to OSM")
        setProvider('osm')
    }, [])

    const searchLocation = async (text: string) => {
        setQuery(text)
        // Only trigger search if text length > 2
        if (text.length <= 2) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        setLoading(true)

        try {
            if (provider === 'google' && googleLoaded && autocompleteService.current) {
                // Google Places Autocomplete
                try {
                    const request = {
                        input: text,
                        sessionToken: sessionToken.current || undefined,
                        componentRestrictions: { country: 'es' }, // Optional: restrict to Spain or make configurable
                    }

                    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                            setSuggestions(predictions.map(p => ({
                                id: p.place_id,
                                display_name: p.description,
                                source: 'google',
                                ...p
                            })))
                            setShowSuggestions(true)
                        } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                            switchToOSM()
                            // Retry with OSM immediately?
                            searchOSM(text)
                        } else {
                            setSuggestions([])
                        }
                        setLoading(false)
                    })
                } catch (e) {
                    console.error("Google Search Error", e)
                    switchToOSM()
                    searchOSM(text)
                }
            } else {
                // OSM Fallback
                await searchOSM(text)
            }
        } catch (error) {
            console.error("Error fetching locations", error)
            setSuggestions([])
            setLoading(false)
        }
    }

    const searchOSM = async (text: string) => {
        try {
            const { searchLocations } = await import('@/shared/actions/location')
            const data = await searchLocations(text)
            setSuggestions(data.map((p: any) => ({ ...p, source: 'osm' })))
            setShowSuggestions(true)
        } catch (e: any) {
            console.error("OSM Search Error", e)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectLocation = (place: any) => {
        if (place.source === 'google') {
            // Google Selection
            if (!placesService.current) return

            placesService.current.getDetails({
                placeId: place.place_id,
                fields: ['geometry', 'name'], // Billing optimization: only geometry and name
                sessionToken: sessionToken.current || undefined
            }, (placeResult, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && placeResult && placeResult.geometry && placeResult.geometry.location) {
                    const lat = placeResult.geometry.location.lat()
                    const lng = placeResult.geometry.location.lng()
                    const name = placeResult.name || place.display_name.split(',')[0]

                    updateLocation(name, lat, lng)

                    // Generate NEW session token for next search
                    sessionToken.current = new google.maps.places.AutocompleteSessionToken()
                } else {
                    console.error("Failed to get place details:", status)
                }
            })
        } else {
            // OSM Selection
            const lat = parseFloat(place.lat)
            const lng = parseFloat(place.lon)
            const display_name = place.display_name.split(',')[0]
            updateLocation(display_name, lat, lng)
        }
    }

    const updateLocation = (name: string, lat: number, lng: number) => {
        setQuery(name)
        setPosition([lat, lng])
        setSuggestions([])
        setShowSuggestions(false)
        onLocationChange(name, lat, lng)
    }

    const handleMapClick = (lat: number, lng: number) => {
        setPosition([lat, lng])
        // If we wanted to reverse geocode, we would do it here. 
        // For now just keeping the coordinates.
        onLocationChange(query, lat, lng)
    }

    return (
        <div className="space-y-4" ref={wrapperRef}>
            <div className="relative">
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => searchLocation(e.target.value)}
                        onFocus={() => {
                            // Ensure session token exists on focus
                            if (provider === 'google' && googleLoaded && !sessionToken.current) {
                                sessionToken.current = new google.maps.places.AutocompleteSessionToken()
                            }
                        }}
                        placeholder="Buscar ubicación..."
                        className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    {loading && (
                        <div className="absolute right-3 top-3">
                            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                        </div>
                    )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                        {suggestions.map((place, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelectLocation(place)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                            >
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{place.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative">
                {/* Hidden div for Google Places Service */}
                <div ref={mapDivRef} style={{ display: 'none' }}></div>

                {/* Google Maps Mode */}
                {provider === 'google' && googleLoaded ? (
                    <GoogleMapPicker
                        center={position}
                        onMapClick={(lat, lng) => handleMapClick(lat, lng)}
                    />
                ) : (
                    /* OSM / Leaflet Mode */
                    <MapContainer
                        center={position}
                        zoom={13}
                        scrollWheelZoom={false}
                        className="h-full w-full"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={(pos) => handleMapClick(pos[0], pos[1])} />
                    </MapContainer>
                )}
            </div>

            {provider === 'google' && !GOOGLE_MAPS_API_KEY && (
                <p className="text-xs text-red-500">
                    * Google Maps API Key missing. Falling back to OSM.
                </p>
            )}

            <p className="text-xs text-gray-500">
                * Busca una ubicación o haz clic en el mapa para ajustar la posición exacta.
                {provider === 'osm' && <span className="text-xs text-gray-400 ml-1">(Modo OpenStreetMap)</span>}
            </p>
        </div>
    )
}
