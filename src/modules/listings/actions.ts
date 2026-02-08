'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateListing(listingId: string, data: {
    title: string
    description: string
    price_per_night: number
    location: string
    image_url: string
}) {
    const supabase = await createClient()

    // 1. Verify Authentication & Ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Check if user owns the listing
    const { data: listing } = await supabase
        .from('listings')
        .select('host_id')
        .eq('id', listingId)
        .single()

    if (!listing || listing.host_id !== user.id) {
        return { error: 'Unauthorized: You do not own this listing' }
    }

    // 2. Update Listing
    const { error } = await supabase
        .from('listings')
        .update({
            title: data.title,
            description: data.description,
            price_per_night: data.price_per_night,
            location: data.location,
            image_url: data.image_url
        })
        .eq('id', listingId)

    if (error) {
        console.error('Update listing error:', error)
        return { error: 'Failed to update listing' }
    }

    // 3. Revalidate paths
    revalidatePath(`/listings/${listingId}`)
    revalidatePath('/dashboard')
    revalidatePath('/search')

    return { success: true }
}
