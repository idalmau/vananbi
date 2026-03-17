'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

export async function getOrCreateConversation(listingId: string, hostId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }
    if (user.id === hostId) return { error: 'No puedes contactarte a ti mismo' }

    // Check existing
    const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listingId)
        .eq('guest_id', user.id)
        .eq('host_id', hostId)
        .single()

    if (existing) {
        return { data: existing.id }
    }

    // Create new
    const { data: created, error } = await supabase
        .from('conversations')
        .insert({
            listing_id: listingId,
            guest_id: user.id,
            host_id: hostId
        })
        .select('id')
        .single()

    if (error) {
        console.error('Error starting conversation:', error)
        return { error: 'Error al iniciar conversación' }
    }

    return { data: created.id }
}

export async function sendChatMessage(conversationId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: content
        })

    if (error) {
        console.error('Error sending chat message:', error)
        return { error: 'Failed to send message' }
    }

    revalidatePath(`/chat/${conversationId}`)
    return { success: true }
}
