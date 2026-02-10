
export type Listing = {
    id: string
    host_id: string
    title: string
    description: string | null
    price_per_night: number // in cents
    location: string
    latitude?: number
    longitude?: number
    image_url: string | null
    cancellation_policy_days: number
    available_from: string | null // ISO Date string
    available_to: string | null // ISO Date string
    status: 'draft' | 'published'
    created_at: string
    amenities?: string[]
    images?: ListingImage[]
    host?: {
        email: string
        role: string
        created_at: string
    }
}

export type ListingImage = {
    id: string
    listing_id: string
    storage_path: string
    url: string
    position: number
    created_at: string
}

export type Amenity = {
    id: string
    label: string
    icon: string
}

export const AMENITY_OPTIONS: Amenity[] = [
    { id: 'kitchen', label: 'Cocina equipada', icon: '🍳' },
    { id: 'shower', label: 'Baño portátil', icon: '🚿' },
    { id: 'heating', label: 'Calefacción estacionaria', icon: '🌡️' },
    { id: 'checkin', label: 'Check-in flexible', icon: '🕒' },
    { id: 'ac', label: 'Aire Acondicionado', icon: '❄️' },
    { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
    { id: 'pets', label: 'Mascotas permitidas', icon: '🐾' },
    { id: 'solar', label: 'Placas solares', icon: '☀️' },
    { id: 'fridge', label: 'Nevera', icon: '🧊' }
]
