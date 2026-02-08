'use server'

import { createClient } from '@/shared/lib/supabase/server'

export interface MonthlyTrend {
    name: string
    current: number
    previous: number
}

const MONTH_NAMES = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

export async function getBookingTrends(
    hostId: string,
    year: number,
    listingId?: string
): Promise<MonthlyTrend[]> {
    const supabase = await createClient()

    // Define the range we need: from Jan 1st (Year - 1) to Dec 31st (Year)
    const startDate = `${year - 1}-01-01`
    const endDate = `${year}-12-31`

    let query = supabase
        .from('bookings')
        .select(`
            start_date,
            end_date,
            listing:listings!inner(id, host_id)
        `)
        .eq('listing.host_id', hostId)
        .eq('status', 'confirmed') // Only confirmed bookings count
        .gte('end_date', startDate) // Ends after start of prev year
        .lte('start_date', endDate) // Starts before end of curr year

    if (listingId && listingId !== 'all') {
        query = query.eq('listing_id', listingId)
    }

    const { data: bookings, error } = await query

    if (error) {
        console.error('Error fetching booking trends:', error)
        // Return empty structure on error
        return MONTH_NAMES.map(name => ({ name, current: 0, previous: 0 }))
    }

    // Initialize counters
    // key: "year-monthIndex" -> nights count
    const monthlyNights: Record<string, number> = {}

    bookings?.forEach(booking => {
        const start = new Date(booking.start_date)
        const end = new Date(booking.end_date)

        // Iterate through each day of the booking
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const y = d.getFullYear()
            const m = d.getMonth() // 0-11

            // Count only if it falls within our target years
            if (y === year || y === year - 1) {
                const key = `${y}-${m}`
                monthlyNights[key] = (monthlyNights[key] || 0) + 1
            }
        }
    })

    // Format for Recharts
    const trends = MONTH_NAMES.map((name, index) => {
        const currentKey = `${year}-${index}`
        const previousKey = `${year - 1}-${index}`
        return {
            name,
            current: monthlyNights[currentKey] || 0,
            previous: monthlyNights[previousKey] || 0
        }
    })

    return trends
}
