import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover' as any, // Use exact SDk version
  appInfo: {
    name: 'Vananbi',
    version: '0.1.0',
  },
})

export const formatAmountForStripe = (amount: number, currency: string) => {
  return amount // already in cents
}

export const createStripeAccount = async (email: string, userId: string) => {
  return await stripe.accounts.create({
    type: 'custom',
    country: 'ES',
    email,
    business_type: 'individual',
    capabilities: {
      transfers: { requested: true }
    },
    metadata: {
      userId,
    },
  })
}

export const createAccountSession = async (accountId: string) => {
  return await stripe.accountSessions.create({
    account: accountId,
    components: {
      account_onboarding: { enabled: true },
    }
  })
}

export const createCheckoutSession = async ({
  amount,
  listingTitle,
  bookingId,
  customerId,
  origin,
}: {
  amount: number,
  listingTitle: string,
  bookingId: string,
  customerId?: string,
  origin: string,
}) => {
  // We no longer deduct application_fee_amount here because we are doing Separate Charges and Transfers.
  // The full amount goes to the Vananbi platform balance.

  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: listingTitle,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer: customerId,
    success_url: `${origin}/bookings/success?id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/listings/${bookingId}`, // or back to listing
    payment_intent_data: {
      setup_future_usage: 'off_session',
      metadata: {
        bookingId,
      },
    },
  })
}
