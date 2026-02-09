
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
    icon?: string
}
