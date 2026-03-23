import { stripe, createStripeAccount, createAccountSession } from '@/shared/lib/stripe'
import { createClient } from '@/shared/lib/supabase/server'

export async function createStripeHostAccount(userId: string, email: string) {
    const supabase = await createClient()

    // 1. Create Stripe Custom Account
    const account = await createStripeAccount(email, userId)

    // 2. Save account_id to profile
    const { error } = await supabase
        .from('profiles')
        .update({ stripe_account_id: account.id })
        .eq('id', userId)

    if (error) throw new Error(error.message)

    return account
}

export async function generateAccountSession(stripeAccountId: string) {
    const session = await createAccountSession(stripeAccountId)
    return session.client_secret
}

