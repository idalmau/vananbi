
// TODO: Install stripe: `npm install stripe`
// import Stripe from 'stripe'

// TODO: Initialize Stripe
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

export async function createPaymentIntent(amount: number, currency: string = 'eur') {
    console.log(`[MOCK PAYMENT] Creating payment intent for ${amount} cents (${currency})`)

    // TODO: Replace with real Stripe call
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount,
    //   currency,
    //   automatic_payment_methods: { enabled: true },
    // })

    // Simulating a network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
        id: `pi_mock_${Math.random().toString(36).substring(7)}_${Date.now()}`,
        client_secret: 'mock_secret_key_for_client',
        status: 'succeeded', // In a real flow, this would be 'requires_payment_method'
    }
}

export async function refundPayment(paymentIntentId: string) {
    console.log(`[MOCK PAYMENT] Refunding payment ${paymentIntentId}`)
    // TODO: Implement Stripe refund
}
