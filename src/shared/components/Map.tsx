'use client'
import { useState, useEffect } from 'react'
import { GoogleMap } from './GoogleMap'
import { LeafletMap } from './LeafletMap'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const DEFAULT_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'google'

interface MapProps {
    listings: any[]
    center?: [number, number]
    zoom?: number
}

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
