'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(bookingId: string, content: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('messages')
        .insert({
            booking_id: bookingId,
            sender_id: user.id,
            content: content
        })

    if (error) {
        console.error('Error sending message:', error)
        return { error: 'Failed to send message' }
    }

    revalidatePath(`/bookings/${bookingId}`)
    return { success: true }
}

export async function markAsRead(bookingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .neq('sender_id', user.id)
        .is('read_at', null)

    revalidatePath('/dashboard')
    revalidatePath(`/bookings/${bookingId}`)
}
