import { getConversation, getConversationMessages } from '@/modules/chat/service'
import { createClient } from '@/shared/lib/supabase/server'
import { ConversationChat } from '@/modules/chat/components/ConversationChat'
import { notFound, redirect } from 'next/navigation'

export default async function ChatPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect('/login')
    }

    const conversationId = (await params).id
    const conversation = await getConversation(conversationId)

    if (!conversation) {
        notFound()
    }

    // Verify user is part of conversation
    if (conversation.guest_id !== user.id && conversation.host_id !== user.id) {
        redirect('/dashboard')
    }

    const initialMessages = await getConversationMessages(conversationId)

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <ConversationChat 
                conversation={conversation}
                initialMessages={initialMessages}
                currentUserId={user.id}
            />
        </div>
    )
}
