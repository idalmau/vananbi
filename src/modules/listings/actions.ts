'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createListing(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Debes iniciar sesión para crear un anuncio' }
    }

    // 2. Extract Data
    const title = formData.get('title') as string
    const location = formData.get('location') as string
    const price = parseFloat(formData.get('price') as string)
    const image_url = formData.get('imageUrl') as string
    const description = formData.get('description') as string
    const vanId = formData.get('vanId') as string
    const vehicleType = (formData.get('vehicleType') as string) || null
    const handoverMethod = (formData.get('handoverMethod') as string) || null

    // 3. Validate
    if (!title || !location || !price || !vanId) {
        return { error: 'Faltan campos obligatorios' }
    }

    // Geocode Location
    const { geocodeLocation } = await import('@/shared/lib/geocoding')
    const coordinates = await geocodeLocation(location)

    // 4. Insert Listing
    const { data: listing, error } = await supabase
        .from('listings')
        .insert({
            host_id: user.id,
            van_id: vanId, // Link to van
            title,
            location,
            price_per_night: Math.round(price * 100), // Convert to cents
            image_url, // Keep as cover or fallback
            description,
            latitude: coordinates?.lat || null,
            longitude: coordinates?.lng || null,
            cancellation_policy_days: 7, // Default
            available_from: null,
            available_to: null,
            status: 'draft', // Start as draft
            amenities: [],
            vehicle_type: vehicleType,
            handover_method: handoverMethod
        })
        .select()
        .single()

    if (error) {
        console.error('Create listing error:', error)
        return { error: 'Error al crear el anuncio. Inténtalo de nuevo.' }
    }

    // 5. Upload Images (if any)
    const files = formData.getAll('images') as File[]
    const validFiles = files.filter(f => f.size > 0 && f.name !== 'undefined')

    if (validFiles.length > 0) {
        const uploadPromises = validFiles.map(async (file, index) => {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${listing.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('listings')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Upload error for file:', file.name, uploadError)
                return null
            }

            const { data: { publicUrl } } = supabase.storage
                .from('listings')
                .getPublicUrl(filePath)

            return {
                listing_id: listing.id,
                storage_path: filePath,
                url: publicUrl,
                position: index
            }
        })

        const uploadedImages = (await Promise.all(uploadPromises)).filter(img => img !== null)

        if (uploadedImages.length > 0) {
            await supabase.from('listing_images').insert(uploadedImages)

            // Update the main image_url if it wasn't provided manually
            if (!image_url && uploadedImages[0]) {
                await supabase.from('listings')
                    .update({ image_url: uploadedImages[0].url })
                    .eq('id', listing.id)
            }
        }
    }

    // 6. Redirect
    revalidatePath('/dashboard')
    redirect(`/listings/${listing.id}`)
}

export async function updateListing(listingId: string, data: {
    title: string
    description: string
    price_per_night: number
    location: string
    image_url: string
    latitude?: number
    longitude?: number
    cancellation_policy_days?: number
    available_from?: string | null
    available_to?: string | null
    amenities?: string[]
    vehicle_type?: string | null
    handover_method?: string | null
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

    let lat = data.latitude
    let lng = data.longitude

    if ((!lat || !lng) && data.location) {
        const { geocodeLocation } = await import('@/shared/lib/geocoding')
        const coordinates = await geocodeLocation(data.location)
        if (coordinates) {
            lat = coordinates.lat
            lng = coordinates.lng
        }
    }

    // 2. Update Listing
    const { error } = await supabase
        .from('listings')
        .update({
            title: data.title,
            description: data.description,
            price_per_night: data.price_per_night,
            location: data.location,
            image_url: data.image_url,
            latitude: lat,
            longitude: lng,
            cancellation_policy_days: data.cancellation_policy_days,
            available_from: data.available_from,
            available_to: data.available_to,
            amenities: data.amenities,
            vehicle_type: data.vehicle_type,
            handover_method: data.handover_method
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

export async function uploadListingImage(listingId: string, formData: FormData) {
    const supabase = await createClient()

    // 1. Verify Auth & Ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: listing } = await supabase
        .from('listings')
        .select('host_id')
        .eq('id', listingId)
        .single()

    if (!listing || listing.host_id !== user.id) {
        return { error: 'Unauthorized' }
    }

    // 2. Upload file
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${listingId}/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(filePath, file)

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: 'Upload failed' }
    }

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('listings')
        .getPublicUrl(filePath)

    // 4. Insert into DB
    const { error: dbError } = await supabase
        .from('listing_images')
        .insert({
            listing_id: listingId,
            storage_path: filePath,
            url: publicUrl,
            position: 999 // Append to end
        })

    if (dbError) {
        return { error: 'Database record failed' }
    }

    revalidatePath(`/listings/${listingId}`)
    return { success: true, url: publicUrl }
}

export async function deleteListingImage(imageId: string, listingId: string, storagePath: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership via RLS AND explicit check

    const { data: listing } = await supabase
        .from('listings')
        .select('host_id')
        .eq('id', listingId)
        .single()

    if (!listing || listing.host_id !== user.id) {
        return { error: 'Unauthorized' }
    }

    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage
        .from('listings')
        .remove([storagePath])

    if (storageError) {
        console.error('Storage delete error:', storageError)
        return { error: 'Failed to delete file' }
    }

    // 2. Delete from DB
    const { error: dbError } = await supabase
        .from('listing_images')
        .delete()
        .eq('id', imageId)

    if (dbError) return { error: 'Failed to delete record' }

    revalidatePath(`/listings/${listingId}`)
    return { success: true }
}

export async function reorderImages(listingId: string, imageIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership
    const { data: listing } = await supabase
        .from('listings')
        .select('host_id')
        .eq('id', listingId)
        .single()

    if (!listing || listing.host_id !== user.id) {
        return { error: 'Unauthorized' }
    }

    // Update positions
    const updates = imageIds.map((id, index) =>
        supabase
            .from('listing_images')
            .update({ position: index })
            .eq('id', id)
            .eq('listing_id', listingId)
    )

    await Promise.all(updates)

    revalidatePath(`/listings/${listingId}`)
    return { success: true }
}

export async function updateListingStatus(listingId: string, status: 'draft' | 'published') {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Check ownership
    const { data: listing } = await supabase
        .from('listings')
        .select('host_id')
        .eq('id', listingId)
        .single()

    if (!listing || listing.host_id !== user.id) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('listings')
        .update({ status })
        .eq('id', listingId)

    if (error) {
        return { error: 'Error modifying status' }
    }

    revalidatePath(`/listings/${listingId}`)
    revalidatePath('/dashboard')
    revalidatePath('/search')
    return { success: true }
}
export async function deleteListing(listingId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Check ownership & status
    const { data: listing } = await supabase
        .from('listings')
        .select('host_id, status')
        .eq('id', listingId)
        .single()

    if (!listing || listing.host_id !== user.id) {
        return { error: 'No autorizado' }
    }

    if (listing.status !== 'draft') {
        return { error: 'Solo los anuncios en borrador se pueden eliminar. Por favor, despublícalo primero.' }
    }

    // Check for future/active bookings
    const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listingId)
        .in('status', ['confirmed', 'pending'])
        .gte('end_date', new Date().toISOString().split('T')[0])

    if (count && count > 0) {
        return { error: 'No se puede eliminar un anuncio con reservas activas o futuras.' }
    }

    // Delete associated bookings first (since no cascade on bookings)
    // We only delete past bookings or cancelled bookings here since we checked future ones above.
    const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('listing_id', listingId)

    if (bookingsError) {
        console.error('Error deleting associated bookings:', bookingsError)
        return { error: 'Error al eliminar las reservas asociadas.' }
    }

    // Delete listing images (storage + db)
    // DB has cascade for listing_images, but storage files might need manual cleanup if triggers aren't set.
    // Let's assume for now we rely on potential storage triggers or just let them be orphaned in bucket (not ideal but safe for MVP).
    // Actually, let's try to clean up storage if possible.
    // Fetch images first
    const { data: images } = await supabase
        .from('listing_images')
        .select('storage_path')
        .eq('listing_id', listingId)

    if (images && images.length > 0) {
        const paths = images.map(img => img.storage_path)
        await supabase.storage.from('listings').remove(paths)
    }

    // Delete Listing
    const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)

    if (error) {
        return { error: 'Error al eliminar el anuncio' }
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}
