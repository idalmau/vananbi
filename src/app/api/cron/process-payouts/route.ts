import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/shared/lib/stripe'

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Escrow ends 24 hours after booking end date
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)

    const { data: payments, error } = await supabase
        .from('payments')
        .select(`
            *,
            bookings!inner (
                end_date,
                status,
                listing_id
            )
        `)
        .eq('status', 'fully_paid')
        .eq('bookings.status', 'confirmed') // Disputed or cancelled bookings won't trigger payout
        .lte('bookings.end_date', yesterday.toISOString())

    if (error || !payments) {
        return NextResponse.json({ error: 'DB error or no payouts due' }, { status: 500 })
    }

    const results = []

    for (const payment of payments) {
        // @ts-ignore
        const listingId = payment.bookings.listing_id

        const { data: listing } = await supabase
            .from('listings')
            .select('host_id')
            .eq('id', listingId)
            .single()
            
        if (!listing?.host_id) continue

        const { data: hostProfile } = await supabase
            .from('profiles')
            .select('stripe_account_id, payouts_enabled')
            .eq('id', listing.host_id)
            .single()

        if (!hostProfile?.stripe_account_id || !hostProfile.payouts_enabled) {
            results.push({ bookingId: payment.booking_id, skipped: 'Host missing stripe account or payouts disabled' })
            continue
        }

        try {
            // Release the escrow funds by manually pushing to the host's connected account
            const transfer = await stripe.transfers.create({
                amount: payment.host_amount,
                currency: 'eur',
                destination: hostProfile.stripe_account_id,
                transfer_group: payment.booking_id,
                metadata: {
                    bookingId: payment.booking_id
                }
            })

            await supabase
                .from('payments')
                .update({ status: 'payout_completed' })
                .eq('id', payment.id)

            results.push({ bookingId: payment.booking_id, transferId: transfer.id })

        } catch (err: any) {
            console.error(`Transfer failed for booking ${payment.booking_id}:`, err)
            results.push({ bookingId: payment.booking_id, error: err.message })
        }
    }

    return NextResponse.json({ processed: results.length, results })
}
