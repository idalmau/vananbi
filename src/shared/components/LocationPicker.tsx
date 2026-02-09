'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Search, MapPin } from 'lucide-react'

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
    const [query, setQuery] = useState(initialLocation)
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [position, setPosition] = useState<[number, number]>([initialLat || 40.4168, initialLng || -3.7038])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Handle outside click to close suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [wrapperRef])

    const searchLocation = async (text: string) => {
        setQuery(text)
        onLocationChange(text, position[0], position[1])

        if (text.length > 2) {
            try {
                // Dynamically import the server action to avoid bundling issues if needed, 
                // but direct import usually works in Next.js client components if the file has 'use server'
                const { searchLocations } = await import('@/shared/actions/location')
                const data = await searchLocations(text)
                setSuggestions(data)
                setShowSuggestions(true)
            } catch (error) {
                console.error("Error fetching locations", error)
            }
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }

    const handleSelectLocation = (place: any) => {
        const lat = parseFloat(place.lat)
        const lng = parseFloat(place.lon)
        const display_name = place.display_name.split(',')[0] // Simplify name

        setQuery(display_name)
        setPosition([lat, lng])
        setSuggestions([])
        setShowSuggestions(false)
        onLocationChange(display_name, lat, lng)
    }

    const handleMapClick = (lat: number, lng: number) => {
        setPosition([lat, lng])
        // Reverse geocoding could go here if we want to update the text based on pin drop
        // For now, we trust the user keeps the text or updates it
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
                        placeholder="Buscar ubicación..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
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
            </div>
            <p className="text-xs text-gray-500">
                * Busca una ubicación o haz clic en el mapa para ajustar la posición exacta.
            </p>
        </div>
    )
}
