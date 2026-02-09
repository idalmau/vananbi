'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: FormData) {
    const supabase = await createClient()

    const bookingId = formData.get('bookingId') as string
    const listingId = formData.get('listingId') as string
    const rating = parseInt(formData.get('rating') as string)
    const comment = formData.get('comment') as string

    if (!bookingId || !listingId || !rating) {
        return { error: 'Faltan datos requeridos.' }
    }

    if (rating < 1 || rating > 5) {
        return { error: 'La valoración debe estar entre 1 y 5.' }
    }

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Debes iniciar sesión.' }
    }

    // Verify booking validity (belongs to user, is past end_date, etc.)
    // We trust RLS / DB constraints mostly, but can add checks.
    // Specifically: Check if end_date < now
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('end_date, status')
        .eq('id', bookingId)
        .single()

    if (bookingError || !booking) {
        return { error: 'Reserva no encontrada.' }
    }

    if (new Date(booking.end_date) > new Date()) {
        return { error: 'Solo puedes valorar una estancia finalizada.' }
    }

    if (booking.status !== 'confirmed') {
        return { error: 'Solo puedes valorar reservas confirmadas.' }
    }

    const { error } = await supabase.from('reviews').insert({
        booking_id: bookingId,
        listing_id: listingId,
        guest_id: user.id,
        rating,
        comment
    })

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { error: 'Ya has enviado una reseña para esta reserva.' }
        }
        return { error: 'Error al guardar la reseña: ' + error.message }
    }

    revalidatePath(`/listings/${listingId}`)
    revalidatePath('/trips')

    return { success: true }
}

export async function getListingReviews(listingId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            guest:profiles(full_name, avatar_url)
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}
