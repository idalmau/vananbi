import { createClient } from '@/shared/lib/supabase/server'
import { Conversation, Message } from './types'

export async function getConversation(id: string): Promise<Conversation | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('conversations')
        .select(`
            *,
            listing:listings (*),
            guest:profiles!guest_id (*),
            host:profiles!host_id (*)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching conversation:', error)
        return null
    }

    return data as Conversation
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    return data as Message[]
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('conversations')
        .select(`
            *,
            listing:listings (id, title, image_url),
            guest:profiles!guest_id (id, email, avatar_url),
            host:profiles!host_id (id, email, avatar_url)
        `)
        .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching user conversations:', error)
        return []
    }

    return data as Conversation[]
}
