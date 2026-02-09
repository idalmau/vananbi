
import { createClient } from '@/shared/lib/supabase/server'

export async function getUserBookings(userId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('bookings')
        .select(`
            *,
            listing:listings (
                id,
                title,
                image_url,
                location
            ),
            reviews:reviews(id)
        `)
        .eq('user_id', userId)
        .order('start_date', { ascending: true })

    return data || []
}

export type SortBy = 'updated_at' | 'created_at' | 'start_date'
export type SortOrder = 'asc' | 'desc'

export async function getHostBookings(
    hostId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: SortBy = 'updated_at',
    sortOrder: SortOrder = 'desc'
) {
    const supabase = await createClient()

    const from = (page - 1) * limit
    const to = from + limit - 1

    // Find bookings for listings owned by this host
    const { data: bookings, count } = await supabase
        .from('bookings')
        .select(`
            *,
            listing:listings!inner (
                id,
                title,
                host_id
            ),
            guest:profiles (
                email,
                first_name,
                last_name
            )
        `, { count: 'exact' })
        .eq('listing.host_id', hostId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to)

    if (!bookings || bookings.length === 0) {
        return { data: [], total: 0, totalPages: 0 }
    }

    // Fetch unread messages count for these bookings
    const bookingIds = bookings.map(b => b.id)
    const { data: unreadMessages } = await supabase
        .from('messages')
        .select('booking_id')
        .in('booking_id', bookingIds)
        .neq('sender_id', hostId) // Messages NOT from me (the host)
        .is('read_at', null)      // And not read yet

    const unreadCounts: Record<string, number> = {}
    unreadMessages?.forEach((msg) => {
        unreadCounts[msg.booking_id] = (unreadCounts[msg.booking_id] || 0) + 1
    })

    const data = bookings.map(b => ({
        ...b,
        unread_count: unreadCounts[b.id] || 0
    }))

    return {
        data,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
    }
}

export async function getListingBookings(listingId: string) {
    const supabase = await createClient()

    // Fetch future bookings for this listing to calculate unavailability
    const { data } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('listing_id', listingId)
        .in('status', ['confirmed', 'pending'])
        .gte('end_date', new Date().toISOString()) // Only future/current bookings

    return data || []
}
