import { stripe } from '@/shared/lib/stripe'
import { createClient } from '@/shared/lib/supabase/server'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    let event: any

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message)
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
    }

    const supabase = await createClient()

    // Handle the event
    switch (event.type) {
        case 'account.updated': {
            const account = event.data.object
            const requirementsDue = account.requirements?.currently_due || []
            const pastDue = account.requirements?.past_due || []
            
            // Combine all due requirements, removing duplicates
            const allDue = Array.from(new Set([...requirementsDue, ...pastDue]))

            await supabase
                .from('profiles')
                .update({ 
                    onboarding_complete: account.details_submitted,
                    stripe_requirements_due: allDue,
                    payouts_enabled: account.payouts_enabled || false
                })
                .eq('stripe_account_id', account.id)

            break
        }

        case 'checkout.session.completed': {
            const session = event.data.object
            const bookingId = session.payment_intent_data?.metadata?.bookingId || session.metadata?.bookingId

            if (bookingId) {
                // 1. Fetch booking details to calculate full amounts
                const { data: booking } = await supabase
                    .from('bookings')
                    .select('*, listings(booking_type)')
                    .eq('id', bookingId)
                    .single()

                if (booking) {
                    const paymentIntentId = session.payment_intent as string
                    
                    // Retrieve PaymentIntent to get the saved PaymentMethod ID
                    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
                    const paymentMethodId = paymentIntent.payment_method as string

                    const feeAmount = Math.round(booking.total_price * 0.1) // 10% platform fee

                    await supabase.from('payments').insert({
                        booking_id: bookingId,
                        amount: booking.total_price, // Total price of the trip
                        deposit_amount: session.amount_total, // The 20% collected now
                        balance_amount: booking.total_price - (session.amount_total || 0),
                        status: 'deposit_paid', // Fractioned checkout flow
                        stripe_payment_id: session.id, // The checkout session ID
                        payment_intent_deposit: paymentIntentId, // The 20% charge ID
                        stripe_payment_method_id: paymentMethodId, // The vault card ID
                        listing_amount: booking.total_price, 
                        fee_amount: feeAmount,
                        host_amount: booking.total_price - feeAmount,
                    })

                    // We let the host know it was booked/paid. The funds are in escrow.
                }
            }
            break
        }

        case 'payment_intent.succeeded': {
            const pi = event.data.object
            if (pi.metadata?.type === 'balance') {
                const bookingId = pi.metadata.bookingId
                await supabase.from('payments').update({
                    status: 'fully_paid',
                    payment_intent_balance: pi.id
                }).eq('booking_id', bookingId)
            }
            break
        }

        default:
            console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
}
