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

export async function blockDates(listingId: string, startDate: Date, endDate: Date) {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // 2. Insert into availability
    // Format range as '[YYYY-MM-DD,YYYY-MM-DD)' for daterange type
    // Note: endDate is exclusive in daterange logic usually, but let's check how we display it.
    // If user selects 20th to 20th, it's 1 day.
    // Daterange '[a,b)' means a <= x < b.
    // So if I want to block day 20, I need [20, 21).
    // Let's assume the UI sends inclusive start/end dates.
    // We should add 1 day to end date for the exclusive upper bound.

    // However, Supabase/Postgres daterange handling can be tricky.
    // Let's formatting them as strings for now and let Postgres handle it if possible, 
    // or construct the string manually.

    const start = startDate.toISOString().split('T')[0]
    const endObj = new Date(endDate)
    endObj.setDate(endObj.getDate() + 1) // Add 1 day for exclusive upper bound
    const end = endObj.toISOString().split('T')[0]

    const rangeString = `[${start},${end})`

    const { error } = await supabase
        .from('availability')
        .insert({
            listing_id: listingId,
            date_range: rangeString,
            reason: 'maintenance' // Default reason for host blocks
        })

    if (error) {
        console.error('Block dates error:', error)
        return { error: 'Failed to block dates. Checks for overlap.' }
    }

    revalidatePath(`/listings/${listingId}`)
    return { success: true }
}

export async function unblockDates(availabilityId: string, listingId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', availabilityId)
    // RLS will ensure they own the listing, but good to be explicit or rely on RLS

    if (error) {
        console.error('Unblock dates error:', error)
        return { error: 'Failed to unblock dates' }
    }

    revalidatePath(`/listings/${listingId}`)
    return { success: true }
}
