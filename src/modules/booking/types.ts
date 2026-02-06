
import { type Listing } from '@/modules/listings/types'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export type Booking = {
    id: string
    user_id: string
    listing_id: string
    start_date: string // ISO date string YYYY-MM-DD
    end_date: string
    total_price: number
    status: BookingStatus
    payment_intent_id?: string
    created_at: string
    listing?: Listing
}

export type Reservation = {
    listing_id: string
    date_range: [string, string] // [start, end)
}
