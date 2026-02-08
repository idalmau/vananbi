import { createClient } from '@/shared/lib/supabase/server'

export interface HostMetrics {
    totalRevenue: number
    totalBookings: number
    occupancyRate: number
    averageNightlyRate: number
}

export async function getHostMetrics(hostId: string): Promise<HostMetrics> {
    const supabase = await createClient()

    // 1. Fetch all bookings for this host's listings
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
            id,
            total_price,
            start_date,
            end_date,
            status,
            listing:listings!inner(id, host_id)
        `)
        .eq('listing.host_id', hostId)
        .eq('status', 'confirmed')

    if (error) {
        console.error('Error fetching host metrics:', error)
        return {
            totalRevenue: 0,
            totalBookings: 0,
            occupancyRate: 0,
            averageNightlyRate: 0
        }
    }

    if (!bookings || bookings.length === 0) {
        return {
            totalRevenue: 0,
            totalBookings: 0,
            occupancyRate: 0,
            averageNightlyRate: 0
        }
    }

    // 2. Calculate Metrics
    const totalBookings = bookings.length
    const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0)

    // Calculate total nights booked
    let totalNights = 0
    bookings.forEach(b => {
        const start = new Date(b.start_date)
        const end = new Date(b.end_date)
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        totalNights += nights
    })

    // Average Nightly Rate (Revenue / Nights)
    const averageNightlyRate = totalNights > 0 ? totalRevenue / totalNights : 0

    // Occupancy Rate (Last 30 days)
    // Simplified: Check how many nights in the last 30 days served were booked
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let nightsBookedInLast30Days = 0
    // We ideally need to check overlap, but for MVP let's just count nights of bookings that *started* in last 30 days?
    // Better: Iterate generic 30 days and check overlap.
    // Optimization: Just count total nights of all bookings that overlap with [now-30, now]
    // Let's stick to a simpler metric for MVP: "Global Occupancy" = Total Nights / (Listings Count * 30)? 
    // Or just "Total Nights Booked" as a stat is safer than "Rate" which needs a denominator (total available nights).
    // Let's try to do a rough "Occupancy Rate" based on active listings.

    const { count: listingsCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', hostId)

    // Denominator: Total potential nights in last 30 days = listingsCount * 30
    // Numerator: Nights occupied in last 30 days.

    // For MVP simplicity, let's change "Occupancy Rate" to "Total Nights Booked" (Simpler and accurate)
    // transforming the interface slightly if needed, but let's try to stick to the plan.
    // Plan said: "(Days booked / 30) * 100".

    // Let's stick to Total Nights for now, or assume 1 listing for the calculation.
    // If we have multiple listings, avoiding complex date math is good.
    // Let's return "Occupancy Rate" as (Total Nights Booked / (Listings * 365)) * 100? No that's yearly.
    // Let's go with: Validation Plan said "(Days booked / 30)". That implies single listing focus or per-listing.
    // Let's pivot "Occupancy Rate" to "Total Nights" to be safe and accurate.
    // But UI expects a rate maybe?
    // Let's just return 0 for now or calculate "Total Nights".

    // Update: Let's do Total Nights instead of Occupancy Rate for MVP 1.
    // But interface has properties.
    // Let's calculate percentage based on "Total Nights / (Bookings * Avg Length?)" - No.
    // Let's just do: Nights Booked / 30 (as if they had 1 listing, capped at 100%).
    // Better: Nights Booked / (Listings Count * 30) * 100.

    const potentialNights = (listingsCount || 1) * 30
    // Calculate overlap with last 30 days
    const today = new Date()
    let occupiedNightsLast30 = 0

    bookings.forEach(b => {
        const start = new Date(b.start_date)
        const end = new Date(b.end_date)

        // Intersection with [thirtyDaysAgo, today]
        const rangeStart = start < thirtyDaysAgo ? thirtyDaysAgo : start
        const rangeEnd = end > today ? today : end

        if (rangeStart < rangeEnd) {
            const days = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))
            occupiedNightsLast30 += days
        }
    })

    const occupancyRate = Math.min(100, Math.round((occupiedNightsLast30 / potentialNights) * 100))

    return {
        totalRevenue,
        totalBookings,
        occupancyRate, // percentage
        averageNightlyRate
    }
}
