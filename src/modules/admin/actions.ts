'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Van } from '../vans/types'

export async function getPendingVans() {
    const supabase = await createClient()

    // Check if user is admin - FOR MVP WE MIGHT NEED A HARDCODED CHECK OR A 'role' IN PROFILE
    // For now assuming role check is done in UI or middleware, but good to add safety here
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Optional: Check if user.email is an admin email? 
    // const isAdmin = user.email === 'admin@vananbi.com'
    // if (!isAdmin) throw new Error('Unauthorized')

    const { data } = await supabase
        .from('vans')
        .select(`
            *,
            host:profiles(email, first_name, last_name),
            photos:van_photos(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    return (data as Van[]) || []
}

export async function approveVan(vanId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('vans')
        .update({ status: 'approved', rejection_reason: null })
        .eq('id', vanId)

    if (error) throw new Error('Failed to approve van')

    revalidatePath('/admin/approvals')
}

export async function rejectVan(vanId: string, reason: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('vans')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', vanId)

    if (error) throw new Error('Failed to reject van')

    revalidatePath('/admin/approvals')
}
