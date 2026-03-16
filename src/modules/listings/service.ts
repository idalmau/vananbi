
import { createClient } from '@/shared/lib/supabase/server'
import { Listing } from './types'

// Mock Data (Fallback)
const MOCK_LISTINGS: Listing[] = [
    {
        id: '1',
        title: 'Volkswagen Grand California 600',
        description: 'Perfecta para escapadas de fin de semana. Totalmente equipada con baño y cocina.',
        price_per_night: 12000,
        location: 'Madrid, España',
        latitude: 40.4168,
        longitude: -3.7038,
        image_url: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=1600',
        host_id: 'mock_host_1',
        created_at: new Date().toISOString(),
        cancellation_policy_days: 7,
        available_from: null,
        available_to: null,
        status: 'published'
    },
    {
        id: '2',
        title: 'Mercedes Marco Polo Horizon',
        description: 'Elegancia y versatilidad. Ideal para viajar por la costa y dormir bajo las estrellas.',
        price_per_night: 14500,
        location: 'Barcelona, España',
        latitude: 41.3851,
        longitude: 2.1734,
        image_url: 'https://images.unsplash.com/photo-1626315862215-62164a2e5783?auto=format&fit=crop&q=80&w=1600',
        host_id: 'mock_host_2',
        created_at: new Date().toISOString(),
        cancellation_policy_days: 7,
        available_from: null,
        available_to: null,
        status: 'published'
    },
    {
        id: '3',
        title: 'Fiat Ducato Camper L2H2',
        description: 'Espaciosa y confortable. La mejor opción para familias o grupos de amigos.',
        price_per_night: 11000,
        location: 'Valencia, España',
        latitude: 39.4699,
        longitude: -0.3763,
        image_url: 'https://images.unsplash.com/photo-1517154596051-c636f31f7ac9?auto=format&fit=crop&q=80&w=1600',
        host_id: 'mock_host_1',
        created_at: new Date().toISOString(),
        cancellation_policy_days: 7,
        available_from: null,
        available_to: null,
        status: 'published'
    }
]

export interface ListingFilters {
    query?: string
    vehicleType?: string[]
    handoverMethod?: string[]
}

export async function getListings(filters?: ListingFilters): Promise<Listing[]> {
    const supabase = await createClient()

    let dbQuery = supabase
        .from('listings')
        .select('*')
        .eq('status', 'published') // Only show published listings
        .or(`available_to.is.null,available_to.gte.${new Date().toISOString().split('T')[0]}`) // Exclude past listings
        .order('created_at', { ascending: false })

    if (filters?.query) {
        // Search in title OR location (case-insensitive)
        dbQuery = dbQuery.or(`title.ilike.%${filters.query}%,location.ilike.%${filters.query}%`)
    }

    if (filters?.vehicleType && filters.vehicleType.length > 0) {
        dbQuery = dbQuery.in('vehicle_type', filters.vehicleType)
    }

    if (filters?.handoverMethod && filters.handoverMethod.length > 0) {
        dbQuery = dbQuery.in('handover_method', filters.handoverMethod)
    }

    const { data, error } = await dbQuery

    if (error) {
        console.error('Fetching listings error:', error)
        return []
    }

    if (!data || data.length === 0) {
        if (filters?.query || filters?.vehicleType || filters?.handoverMethod) return []

        console.log('Fetching listings empty, using mock data')
        return MOCK_LISTINGS
    }

    return data as Listing[]
}

export async function getListingById(id: string): Promise<Listing | null> {
    const supabase = await createClient()

    // Check mock first (if ID is '1', '2', '3') because DB might be empty.
    const mock = MOCK_LISTINGS.find(l => l.id === id)
    if (mock) {
        // mock doesn't have host info joined, so we skip host details for mock?
        // or we return mock.
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', mock.host_id).single()
        if (profile) return { ...mock, host: profile }
        return mock
    }

    const { data, error } = await supabase
        .from('listings')
        .select('*, host:profiles(*), images:listing_images(*)')
        .eq('id', id)
        .order('position', { foreignTable: 'listing_images', ascending: true })
        .single()

    if (error) {
        console.error('Fetching listing by id error:', error)
        return null
    }

    return data as Listing
}

export async function getHostListings(hostId: string): Promise<Listing[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('host_id', hostId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetching host listings error:', error)
        return []
    }

    return data as Listing[]
}

export async function getListingAvailability(listingId: string): Promise<{ start_date: string, end_date: string, source: 'booking' | 'block', id?: string }[]> {
    const supabase = await createClient()

    // 1. Get Bookings (Confirmed or Pending)
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, start_date, end_date')
        .eq('listing_id', listingId)
        .in('status', ['confirmed', 'pending'])
        .gte('end_date', new Date().toISOString())

    if (bookingsError) {
        console.error('Error fetching bookings for availability:', bookingsError)
    }

    // 2. Get Host Blocks (Availability Table)
    const { data: blocks, error: blocksError } = await supabase
        .from('availability')
        .select('id, date_range')
        .eq('listing_id', listingId)

    if (blocksError) {
        console.error('Error fetching availability blocks:', blocksError)
    }

    const bookingRanges = (bookings || []).map(b => ({
        start_date: b.start_date,
        end_date: b.end_date,
        source: 'booking' as const,
        id: b.id
    }))

    // Parse daterange strings if any
    const blockRanges = (blocks || []).map((b: any) => {
        // Simple regex to parse "[start,end)"
        const match = b.date_range.match(/\[(.*?),(.*?)\)/)
        if (match) {
            const endDate = new Date(match[2])
            endDate.setDate(endDate.getDate() - 1)
            const inclusiveEnd = endDate.toISOString().split('T')[0]

            return {
                start_date: match[1],
                end_date: inclusiveEnd,
                source: 'block' as const,
                id: b.id
            }
        }
        return null
    }).filter(Boolean) as { start_date: string, end_date: string, source: 'block', id: string }[]

    return [...bookingRanges, ...blockRanges]
}

export async function getListingReviews(listingId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('reviews')
        .select(`
            *,
            guest:profiles(full_name, avatar_url)
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })

    return data || []
}
