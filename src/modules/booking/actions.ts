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

    if (!listingId || !startDate || !endDate) {
        return { error: 'Datos de reserva inválidos.' }
    }

    // Fetch Listing to verify price & get policy
    const { data: listing } = await supabase
        .from('listings')
        .select('title, price_per_night, cancellation_policy_days, available_from, available_to, booking_type, host_id')
        .eq('id', listingId)
        .single()

    if (!listing) {
        return { error: 'El anuncio no existe.' }
    }

    // Validate Availability Window
    if (listing.available_from && new Date(startDate) < new Date(listing.available_from)) {
        return { error: `Este vehículo solo está disponible a partir del ${new Date(listing.available_from).toLocaleDateString()}.` }
    }
    if (listing.available_to && new Date(endDate) > new Date(listing.available_to)) {
        return { error: `Este vehículo solo está disponible hasta el ${new Date(listing.available_to).toLocaleDateString()}.` }
    }

    const pricePerNight = listing.price_per_night
    const nights = getDaysCount(startDate, endDate)
    if (nights < 1) {
        return { error: 'La reserva debe ser de al menos 1 noche.' }
    }
    const totalPrice = nights * pricePerNight

    // Overlap check
    const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listingId)
        .filter('start_date', 'lt', endDate)
        .filter('end_date', 'gt', startDate)
        .in('status', ['confirmed', 'pending'])

    if (count && count > 0) {
        return { error: 'Estas fechas ya están reservadas.' }
    }

    // --- PAYMENT INTEGRATION START ---
    const isInstant = listing.booking_type === 'instant'

    // 1. Fetch host's Stripe account ONLY if instant
    if (isInstant) {
        const { data: hostProfile } = await supabase
            .from('profiles')
            .select('stripe_account_id, onboarding_complete')
            .eq('id', listing.host_id)
            .single()

        if (!hostProfile?.stripe_account_id || !hostProfile?.onboarding_complete) {
            return { error: 'El anfitrión aún no ha configurado sus pagos. Inténtalo más tarde.' }
        }
    }

    // 1.5 Get or Create Stripe Customer for Guest
    const { stripe } = await import('@/shared/lib/stripe')
    const { data: guestProfile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
    
    let stripeCustomerId = guestProfile?.stripe_customer_id
    if (!stripeCustomerId) {
        try {
            const customer = await stripe.customers.create({
                email: user.email || undefined,
            })
            stripeCustomerId = customer.id
            await supabase.from('profiles').update({ stripe_customer_id: stripeCustomerId }).eq('id', user.id)
        } catch (err: any) {
            console.error('Failed to create stripe customer', err)
            return { error: 'Error al iniciar sistema de pago.' }
        }
    }

    // 2. Create Booking record
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { data: booking, error: insertError } = await supabase.from('bookings').insert({
        user_id: user.id,
        listing_id: listingId,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        status: isInstant ? 'confirmed' : 'pending',
        cancellation_policy_snapshot: listing.cancellation_policy_days || 7
    }).select().single()

    if (insertError) {
        console.error('Booking error:', insertError)
        return { error: 'Error al procesar la reserva.' }
    }

    if (isInstant) {
        // 3. Create Stripe Checkout Session
        const { createCheckoutSession } = await import('@/shared/lib/stripe')
        
        // Fractioned Payment Logic: 20% Deposit
        const depositAmount = Math.round(totalPrice * 0.2)
        const balanceAmount = totalPrice - depositAmount

        try {
            const session = await createCheckoutSession({
                amount: depositAmount,
                listingTitle: listing.title,
                bookingId: booking.id,
                customerId: stripeCustomerId,
                origin
            })

            // 4. Redirect to Stripe
            if (session.url) {
                redirect(session.url)
            } else {
                return { error: 'No se pudo generar el enlace de pago.' }
            }
        } catch (checkoutError: any) {
            console.error('Stripe Checkout session error:', checkoutError)
            await supabase.from('bookings').delete().eq('id', booking.id)
            return { error: 'Error al iniciar el pago con Stripe.' }
        }
    } else {
        // Just redirect to success page for request-to-book
        revalidatePath('/dashboard')
        redirect(`/bookings/success?id=${booking.id}`)
    }
    // --- PAYMENT INTEGRATION END ---
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

export async function confirmBooking(bookingId: string) {
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Debes iniciar sesión.' }
    }

    // Verify Is Host of the listing
    // We need to join bookings -> listings to check host_id
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
            *,
            listing:listings (
                host_id
            )
        `)
        .eq('id', bookingId)
        .single()

    if (fetchError || !booking) {
        return { error: 'Reserva no encontrada.' }
    }

    // Check if user is the host
    // @ts-ignore - Supabase types inference might be tricky with nested joins sometimes
    if (booking.listing.host_id !== user.id) {
        return { error: 'No tienes permiso para gestionar esta reserva.' }
    }

    if (booking.status !== 'pending') {
        return { error: 'Esta reserva no está pendiente.' }
    }

    // Update status
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId)

    if (error) {
        return { error: 'Error al confirmar la reserva.' }
    }

    // Create Payment (If we moved payment creation here, but we already created it as pending/succeeded in createBooking? 
    // In current flow: payment is already in 'payments' table as 'succeeded' (mock).
    // In a real flow, we would Capture the payment here.
    // For MVP, we just update status.

    revalidatePath('/dashboard')
    return { success: true }
}

export async function rejectBooking(bookingId: string) {
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Debes iniciar sesión.' }
    }

    // Verify Is Host
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
            *,
            listing:listings (
                host_id
            )
        `)
        .eq('id', bookingId)
        .single()

    if (fetchError || !booking) {
        return { error: 'Reserva no encontrada.' }
    }

    // @ts-ignore
    if (booking.listing.host_id !== user.id) {
        return { error: 'No tienes permiso para gestionar esta reserva.' }
    }

    if (booking.status !== 'pending') {
        return { error: 'Esta reserva no está pendiente.' }
    }

    // Update status
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId)

    if (error) {
        return { error: 'Error al rechazar la reserva.' }
    }

    // TODO: Trigger Refund if payment was captured.

    revalidatePath('/dashboard')
    return { success: true }
}

export async function payForBooking(bookingId: string) {
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Debes iniciar sesión.' }
    }

    // Verify booking
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
            *,
            listing:listings (
                title, host_id
            )
        `)
        .eq('id', bookingId)
        .single()

    if (fetchError || !booking) {
        return { error: 'Reserva no encontrada.' }
    }

    if (booking.user_id !== user.id) {
        return { error: 'No tienes permiso para pagar esta reserva.' }
    }

    if (booking.status !== 'confirmed') {
        return { error: 'La reserva no está lista para el pago.' }
    }

    // Fetch host's Stripe account
    const { data: hostProfile } = await supabase
        .from('profiles')
        .select('stripe_account_id, onboarding_complete')
        .eq('id', booking.listing.host_id)
        .single()

    if (!hostProfile?.stripe_account_id || !hostProfile?.onboarding_complete) {
        return { error: 'El anfitrión aún no ha completado su configuración de pagos. Por favor, avísale.' }
    }

    // 1.5 Get or Create Stripe Customer for Guest
    const { stripe } = await import('@/shared/lib/stripe')
    const { data: guestProfile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
    
    let stripeCustomerId = guestProfile?.stripe_customer_id
    if (!stripeCustomerId) {
        try {
            const customer = await stripe.customers.create({
                email: user.email || undefined,
            })
            stripeCustomerId = customer.id
            await supabase.from('profiles').update({ stripe_customer_id: stripeCustomerId }).eq('id', user.id)
        } catch (err: any) {
            console.error('Failed to create stripe customer', err)
            return { error: 'Error al iniciar sistema de pago.' }
        }
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { createCheckoutSession } = await import('@/shared/lib/stripe')
    
    const depositAmount = Math.round(booking.total_price * 0.2)

    try {
        const session = await createCheckoutSession({
            amount: depositAmount,
            listingTitle: booking.listing.title,
            bookingId: booking.id,
            customerId: stripeCustomerId,
            origin
        })

        if (session.url) {
            redirect(session.url)
        } else {
            return { error: 'No se pudo generar el enlace de pago.' }
        }
    } catch (checkoutError: any) {
        console.error('Stripe Checkout session error:', checkoutError)
        return { error: 'Error al iniciar el pago con Stripe.' }
    }
}
