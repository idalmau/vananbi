import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/shared/lib/stripe'

export async function GET(req: Request) {
    // Basic security for cron (Vercel sets this header if configured)
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find bookings that start in <= 7 days where we only have the deposit
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const { data: payments, error } = await supabase
        .from('payments')
        .select(`
            *,
            bookings!inner (
                start_date,
                user_id
            )
        `)
        .eq('status', 'deposit_paid')
        .lte('bookings.start_date', sevenDaysFromNow.toISOString())

    if (error || !payments) {
        return NextResponse.json({ error: 'DB error or no payments due' }, { status: 500 })
    }

    const results = []

    for (const payment of payments) {
        // @ts-ignore - typed loosely due to nested inner join select
        const userId = payment.bookings.user_id

        const { data: guest } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single()

        if (!guest?.stripe_customer_id || !payment.stripe_payment_method_id) continue

        try {
            // Initiate the 80% charge securely in the background (Merchant-Initiated Transaction)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: payment.balance_amount,
                currency: 'eur',
                customer: guest.stripe_customer_id,
                payment_method: payment.stripe_payment_method_id,
                off_session: true,
                confirm: true, // Attempt to charge immediately
                metadata: {
                    bookingId: payment.booking_id,
                    type: 'balance'
                }
            })

            results.push({ bookingId: payment.booking_id, status: paymentIntent.status })

        } catch (err: any) {
            console.error(`Failed to charge balance for booking ${payment.booking_id}:`, err)
            results.push({ bookingId: payment.booking_id, error: err.message })
        }
    }

    return NextResponse.json({ processed: results.length, results })
}
