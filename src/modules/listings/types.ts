
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
    created_at: string
    host?: {
        email: string
        role: string
        created_at: string
    }
}

export type Amenity = {
    id: string
    label: string
    icon?: string
}
