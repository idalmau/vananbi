
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
            )
        `)
        .eq('user_id', userId)
        .order('start_date', { ascending: true })

    return data || []
}

export async function getHostBookings(hostId: string) {
    const supabase = await createClient()

    // Find bookings for listings owned by this host
    const { data } = await supabase
        .from('bookings')
        .select(`
            *,
            listing:listings (
                id,
                title
            ),
            guest:profiles (
                email,
                first_name,
                last_name
            )
        `)
        .eq('listing.host_id', hostId)
    // Note: Supabase rigorous filtering on joined tables might need specific syntax or two steps if not using foreign keys correctly in filter.
    // But let's try standard nested filter. Actually, .eq('listings.host_id', ...) works if relation is right.
    // A safer way is: filtering the inner join.
    // Let's rely on the policy "Hosts can view bookings for their listings" and just select all bookings visible?
    // No, we need to filter if I am a host but also a guest in other places? 
    // The policy I wrote: "Hosts can view bookings for their listings".
    // It does NOT say "Hosts can view bookings they made as a guest". 
    // Wait, "Users can view own bookings" covers my guest bookings.

    // So `select * from bookings` will return (My Guest Bookings) + (My Host Bookings).
    // I need to distinguish them.

    // Let's fetch all and filter in code, or use more specific query.
    // Query for "Bookings where listing.host_id = ME"

    // Easier approach with Supabase:
    // .filter('listing.host_id', 'eq', hostId) -> this implies an inner join filter often.

    // Let's try to fetch listings first, then bookings? No, that's N+1.

    // Correct Supabase syntax for filtering on joined table:
    // .not('listing', 'is', null) implies inner join?
    // Let's try: !inner on listing.

    const { data: bookings } = await supabase
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
        `)
        .eq('listing.host_id', hostId)
        .order('start_date', { ascending: true })

    if (!bookings || bookings.length === 0) {
        return []
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

    return bookings.map(b => ({
        ...b,
        unread_count: unreadCounts[b.id] || 0
    }))
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
