'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'

// I will use native Date for now to avoid deps, or install date-fns if complex.
// Difference in days is simple math.

function getDaysCount(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
}

export async function createBooking(formData: FormData) {
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Debes iniciar sesión para reservar.' }
    }

    const listingId = formData.get('listingId') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const pricePerNight = parseInt(formData.get('pricePerNight') as string)

    if (!listingId || !startDate || !endDate) {
        return { error: 'Datos de reserva inválidos.' }
    }

    // Calculate total price
    const nights = getDaysCount(startDate, endDate)
    if (nights < 1) {
        return { error: 'La reserva debe ser de al menos 1 noche.' }
    }
    const totalPrice = nights * pricePerNight

    // Optimistic approach: Try to insert. The DB Exclusion Constraint will fail if overlapping.
    // Note: We need to verify the table schema has the exclusion constraint set up correctly for 'bookings' or 'availability'.
    // The PRD mentioned using `availability` table or `bookings` with exclusion.
    // My schema.sql put the exclusion on `availability`. 
    // For the MVP, if I only insert into `bookings`, I need to make sure `bookings` also has the constraint OR I insert into `availability` too.
    // To keep it simple and robust: I will insert into `bookings` and rely on a check or valid constraint.
    // Actually, checking schema.sql, I added the constraint to `availability`.
    // AND I didn't add it to `bookings` yet? Let me check schema.sql.
    // I should double check if I added it to bookings. If not, I should explicitly check availability or add the constraint to bookings.
    // Let's add the constraint to bookings if missing, or use manual check.
    // Better: Manual check for existing overlapping bookings in this Transaction block (or just query first for MVP).

    // Quick check:
    const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('listing_id', listingId)
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
    // This logic checks overlap: (StartA <= EndB) and (EndA >= StartB)

    // Refined overlap check for [start, end) intervals usually, but here we likely have inclusive dates?
    // Let's use a simpler overlap query:
    // WHERE listing_id = id AND NOT (end_date < requested_start OR start_date > requested_end)

    const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listingId)
        .filter('start_date', 'lt', endDate)
        .filter('end_date', 'gt', startDate)
        .in('status', ['confirmed', 'pending']) // Assuming pending blocks too?

    if (count && count > 0) {
        return { error: 'Estas fechas ya están reservadas.' }
    }



    // --- PAYMENT INTEGRATION START ---
    // TODO: For a real flow, you might create the booking as 'pending' first, 
    // then create a PaymentIntent, and confirm the booking via Webhook.
    // Or create PaymentIntent on the client, and only create Booking on success.
    // For this MVP, we simulate a successful server-side payment capture.

    const { createPaymentIntent } = await import('@/modules/payments/service')
    const payment = await createPaymentIntent(totalPrice)

    if (!payment.id) {
        return { error: 'Error al iniciar el pago.' }
    }
    // --- PAYMENT INTEGRATION END ---

    // Create Booking
    const { data, error } = await supabase.from('bookings').insert({
        user_id: user.id,
        listing_id: listingId,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        status: 'confirmed', // Confirmed immediately for MVP Mock
        payment_intent_id: payment.id // Storing the mock ID
    }).select().single()

    if (error) {
        console.error('Booking error:', error)
        return { error: 'Error al procesar la reserva.' }
    }

    revalidatePath('/dashboard')
    redirect(`/bookings/success?id=${data.id}`)
}

export async function cancelBooking(bookingId: string) {
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Debes iniciar sesión.' }
    }

    // Verify ownership and status
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('user_id, status')
        .eq('id', bookingId)
        .single()

    if (fetchError || !booking) {
        return { error: 'Reserva no encontrada.' }
    }

    if (booking.user_id !== user.id) {
        return { error: 'No tienes permiso para cancelar esta reserva.' }
    }

    if (booking.status === 'cancelled') {
        return { error: 'La reserva ya está cancelada.' }
    }

    // Update status
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

    if (error) {
        return { error: 'Error al cancelar la reserva.' }
    }

    revalidatePath('/dashboard')
    return { success: true }
}
