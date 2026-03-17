'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MapPin, Calendar as CalendarIcon, User, Search, Loader2, X } from 'lucide-react'
import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export function SearchBar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Search State
    const [query, setQuery] = useState(searchParams.get('destination') || '')
    const [locationInput, setLocationInput] = useState(searchParams.get('destination') || '')
    const [lat, setLat] = useState<number | null>(searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null)
    const [lng, setLng] = useState<number | null>(searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null)
    
    // Date State
    const initialStartDate = searchParams.get('startDate') ? parse(searchParams.get('startDate')!, 'yyyy-MM-dd', new Date()) : undefined
    const initialEndDate = searchParams.get('endDate') ? parse(searchParams.get('endDate')!, 'yyyy-MM-dd', new Date()) : undefined
    const [date, setDate] = useState<DateRange | undefined>(initialStartDate ? { from: initialStartDate, to: initialEndDate } : undefined)
    
    // Guests State
    const [guests, setGuests] = useState(searchParams.get('guests') ? parseInt(searchParams.get('guests')!, 10) : 1)

    // UI State
    const [activeTab, setActiveTab] = useState<'location' | 'dates' | 'guests' | null>(null)
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [loadingLocation, setLoadingLocation] = useState(false)
    const searchContainerRef = useRef<HTMLDivElement>(null)

    // Google services
    const [googleLoaded, setGoogleLoaded] = useState(false)
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
    const placesService = useRef<google.maps.places.PlacesService | null>(null)
    const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
    const mapDivRef = useRef<HTMLDivElement>(null)

    // Initialize Google Maps
    useEffect(() => {
        if (GOOGLE_MAPS_API_KEY && !googleLoaded) {
            setOptions({
                key: GOOGLE_MAPS_API_KEY,
                v: "weekly"
            })

            importLibrary("places").then(() => {
                setGoogleLoaded(true)
                autocompleteService.current = new google.maps.places.AutocompleteService()
                sessionToken.current = new google.maps.places.AutocompleteSessionToken()
                if (mapDivRef.current) {
                    placesService.current = new google.maps.places.PlacesService(mapDivRef.current)
                }
            }).catch(e => console.error("Failed to load Google Maps:", e))
        }
    }, [googleLoaded])


    const searchLocation = async (text: string) => {
        setLocationInput(text)
        if (text.length <= 2) {
            setSuggestions([])
            return
        }

        setLoadingLocation(true)

        if (googleLoaded && autocompleteService.current) {
            const request = {
                input: text,
                sessionToken: sessionToken.current || undefined,
                componentRestrictions: { country: 'es' },
            }

            autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setSuggestions(predictions)
                } else {
                    setSuggestions([])
                }
                setLoadingLocation(false)
            })
        } else {
            setLoadingLocation(false)
        }
    }

    const selectLocation = (place: google.maps.places.AutocompletePrediction) => {
        if (!placesService.current) return

        placesService.current.getDetails({
            placeId: place.place_id,
            fields: ['geometry', 'name'],
            sessionToken: sessionToken.current || undefined
        }, (placeResult, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && placeResult?.geometry?.location) {
                const name = placeResult.name || place.description.split(',')[0]
                setQuery(name)
                setLocationInput(name)
                setLat(placeResult.geometry.location.lat())
                setLng(placeResult.geometry.location.lng())
                setSuggestions([])
                setActiveTab('dates') // Auto advance to dates
                sessionToken.current = new google.maps.places.AutocompleteSessionToken()
            }
        })
    }

    const clearLocation = (e: React.MouseEvent) => {
        e.stopPropagation()
        setQuery('')
        setLocationInput('')
        setLat(null)
        setLng(null)
        setSuggestions([])
    }

    const handleSearch = () => {
        setActiveTab(null)
        const params = new URLSearchParams()
        if (query) params.set('destination', query)
        if (lat && lng) {
            params.set('lat', lat.toString())
            params.set('lng', lng.toString())
        }
        if (date?.from) params.set('startDate', format(date.from, 'yyyy-MM-dd'))
        if (date?.to) params.set('endDate', format(date.to, 'yyyy-MM-dd'))
        if (guests > 1) params.set('guests', guests.toString())

        router.push(`/search?${params.toString()}`)
    }

    return (
        <div ref={searchContainerRef} className="hidden md:flex items-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 p-2 pl-6 relative">
            <div ref={mapDivRef} style={{ display: 'none' }}></div>
            
            {/* Location */}
                <Popover open={activeTab === 'location'} onOpenChange={(open) => setActiveTab(open ? 'location' : null)}>
                    <div 
                        className="flex flex-col flex-1 min-w-[140px] text-left hover:bg-gray-100 rounded-full py-2 px-4 -ml-4 focus-within:bg-white focus-within:shadow-md transition-all relative"
                        onClick={() => setActiveTab('location')}
                    >
                        <span className="text-xs font-bold text-gray-800 tracking-wider cursor-default">Dónde</span>
                        <PopoverAnchor asChild>
                            <input 
                                placeholder="Buscar destinos..." 
                                value={locationInput}
                                onChange={(e) => {
                                    searchLocation(e.target.value)
                                    if (activeTab !== 'location') setActiveTab('location')
                                }}
                                onFocus={() => setActiveTab('location')}
                                className="bg-transparent border-none p-0 text-sm text-gray-600 focus:ring-0 w-full cursor-text outline-none placeholder:text-gray-400"
                            />
                        </PopoverAnchor>
                        {query && (
                            <div 
                                onClick={clearLocation}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-500 z-10 cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                <PopoverContent className="w-96 rounded-3xl p-4 mt-4" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    {suggestions.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {suggestions.map((place, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectLocation(place)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors"
                                >
                                    <div className="bg-gray-100 p-2 rounded-lg">
                                        <MapPin className="h-5 w-5 text-gray-700" />
                                    </div>
                                    <div className="flex pl-1 flex-col">
                                        <span className="text-md font-medium text-gray-900 truncate">
                                            {place.structured_formatting ? place.structured_formatting.main_text : place.description.split(',')[0]}
                                        </span>
                                        {place.structured_formatting?.secondary_text && (
                                            <span className="text-sm text-gray-500 truncate">{place.structured_formatting.secondary_text}</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                            {loadingLocation ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Busca por región, ciudad o código postal.'}
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            <div className="w-px h-8 bg-gray-200 mx-2"></div>

            {/* Dates */}
            <Popover open={activeTab === 'dates'} onOpenChange={(open) => setActiveTab(open ? 'dates' : null)}>
                <div 
                    className="flex flex-col flex-1 min-w-[150px] text-left hover:bg-gray-100 rounded-full py-2 px-4 focus-within:bg-white focus-within:shadow-md transition-all truncate"
                    onClick={() => setActiveTab('dates')}
                >
                    <PopoverAnchor asChild>
                        <div className="flex w-full justify-between items-center cursor-pointer">
                             <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-800 tracking-wider">Cuándo</span>
                                <span className={cn("text-sm", date ? "text-gray-900" : "text-gray-400")}>
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "d MMM", { locale: es })} - {format(date.to, "d MMM", { locale: es })}
                                            </>
                                        ) : (
                                            format(date.from, "d MMM", { locale: es })
                                        )
                                    ) : (
                                        <span>Añade fechas</span>
                                    )}
                                </span>
                             </div>
                             {date && (
                                 <div 
                                    onClick={(e) => { e.stopPropagation(); setDate(undefined) }}
                                    className="p-1 hover:bg-gray-200 rounded-full text-gray-500 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </div>
                             )}
                        </div>
                    </PopoverAnchor>
                </div>
                <PopoverContent className="w-auto p-0 rounded-3xl mt-4" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={(range) => {
                            setDate(range)
                            // If user selected both from and to, advance to guests
                            if (range?.from && range?.to) {
                                setActiveTab('guests')
                            }
                        }}
                        numberOfMonths={2}
                        locale={es}
                        disabled={(date) => {
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            return date < today;
                        }}
                        className="p-4"
                    />
                </PopoverContent>
            </Popover>

            <div className="w-px h-8 bg-gray-200 mx-2"></div>

            {/* Guests */}
             <Popover open={activeTab === 'guests'} onOpenChange={(open) => setActiveTab(open ? 'guests' : null)}>
                <div 
                    className="flex flex-col flex-1 min-w-[120px] text-left hover:bg-gray-100 rounded-full py-2 px-4 focus-within:bg-white focus-within:shadow-md transition-all truncate cursor-pointer"
                    onClick={() => setActiveTab('guests')}
                >
                    <PopoverAnchor asChild>
                        <div>
                            <span className="text-xs font-bold text-gray-800 tracking-wider block">Quién</span>
                            <span className={cn("text-sm block", guests > 0 ? "text-gray-900" : "text-gray-400")}>
                                {guests} {guests === 1 ? 'viajero' : 'viajeros'}
                            </span>
                        </div>
                    </PopoverAnchor>
                </div>
                <PopoverContent className="w-80 rounded-3xl p-6 mt-4" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">Viajeros</span>
                            <span className="text-sm text-gray-500">Edad 13 o más</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setGuests(Math.max(1, guests - 1))}
                                disabled={guests <= 1}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-800 hover:text-gray-800 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-500"
                            >
                                -
                            </button>
                            <span className="w-4 text-center font-medium">{guests}</span>
                            <button 
                                onClick={() => setGuests(Math.min(10, guests + 1))}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-800 hover:text-gray-800"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Search Button */}
            <button 
                onClick={handleSearch}
                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 flex items-center justify-center transition-colors active:scale-95"
            >
                <Search className="h-5 w-5" />
            </button>
        </div>
    )
}
