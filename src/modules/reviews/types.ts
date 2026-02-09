export type Review = {
    id: string
    created_at: string
    booking_id: string
    listing_id: string
    guest_id: string
    rating: number
    comment: string | null
    guest?: {
        full_name: string
        avatar_url: string | null
    }
}
