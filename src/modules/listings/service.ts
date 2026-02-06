
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
        image_url: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=1600',
        host_id: 'mock_host_1',
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        title: 'Mercedes Marco Polo Horizon',
        description: 'Elegancia y versatilidad. Ideal para viajar por la costa y dormir bajo las estrellas.',
        price_per_night: 14500,
        location: 'Barcelona, España',
        image_url: 'https://images.unsplash.com/photo-1626315862215-62164a2e5783?auto=format&fit=crop&q=80&w=1600',
        host_id: 'mock_host_2',
        created_at: new Date().toISOString()
    },
    {
        id: '3',
        title: 'Fiat Ducato Camper L2H2',
        description: 'Espaciosa y confortable. La mejor opción para familias o grupos de amigos.',
        price_per_night: 11000,
        location: 'Valencia, España',
        image_url: 'https://images.unsplash.com/photo-1517154596051-c636f31f7ac9?auto=format&fit=crop&q=80&w=1600',
        host_id: 'mock_host_1',
        created_at: new Date().toISOString()
    }
]

export async function getListings(query?: string): Promise<Listing[]> {
    const supabase = await createClient()

    let dbQuery = supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

    if (query) {
        // Search in title OR location (case-insensitive)
        dbQuery = dbQuery.or(`title.ilike.%${query}%,location.ilike.%${query}%`)
    }

    const { data, error } = await dbQuery

    if (error) {
        console.error('Fetching listings error:', error)
        return []
    }

    if (!data || data.length === 0) {
        // If no query and no data, maybe return mock? 
        // But if filtering, we should return empty if no match.
        if (query) return []

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
        .select('*, host:profiles(*)')
        .eq('id', id)
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
