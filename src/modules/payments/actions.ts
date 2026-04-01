'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { 
    createStripeHostAccount, 
    generateAccountSession 
} from './service'

export async function getAccountSessionClientSecret() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Debes iniciar sesión' }
    }

    // Get profile to check for existing stripe_account_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Perfil no encontrado' }

    let stripeAccountId = profile.stripe_account_id

    try {
        if (!stripeAccountId) {
            const account = await createStripeHostAccount(user.id, profile.email)
            stripeAccountId = account.id
        }

        const clientSecret = await generateAccountSession(stripeAccountId)
        return { clientSecret }
    } catch (error: any) {
        console.error('Account Session error:', error)
        return { error: error.message || 'Error al conectar con Stripe' }
    }
}
