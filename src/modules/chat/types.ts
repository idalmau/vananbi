import { Profile } from '@/modules/auth/types'
import { Listing } from '@/modules/listings/types'

export interface Conversation {
    id: string
    listing_id: string
    guest_id: string
    host_id: string
    created_at: string
    listing?: Listing
    guest?: Profile
    host?: Profile
    last_message?: Message
}

export interface Message {
    id: string
    conversation_id?: string
    booking_id?: string
    sender_id: string
    content: string
    created_at: string
    read_at: string | null
    sender?: Profile
}
