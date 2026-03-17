'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/shared/lib/supabase/client'
import { sendChatMessage } from '@/modules/chat/actions'
import { Send, MessageCircle, ChevronLeft } from 'lucide-react'
import { Message, Conversation } from '@/modules/chat/types'
import Image from 'next/image'
import Link from 'next/link'

interface ConversationChatProps {
    conversation: Conversation
    initialMessages: Message[]
    currentUserId: string
}

export function ConversationChat({ conversation, initialMessages, currentUserId }: ConversationChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    const otherUser = conversation.guest_id === currentUserId ? conversation.host : conversation.guest
    const listing = conversation.listing

    useEffect(() => {
        const channel = supabase
            .channel(`conversation:${conversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversation.id}`
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    setMessages((prev) => {
                        if (prev.find(m => m.id === newMsg.id)) return prev
                        return [...prev, newMsg]
                    })
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversation.id, supabase])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView()
    }, [])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isSending) return

        setIsSending(true)
        const content = newMessage
        setNewMessage('')

        const result = await sendChatMessage(conversation.id, content)
        setIsSending(false)

        if (result?.error) {
            alert('Error al enviar mensaje')
            setNewMessage(content)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-white dark:bg-zinc-950 rounded-3xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden relative ring-2 ring-gray-50 dark:ring-zinc-800">
                        <Image
                            src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.id}`}
                            alt="User"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                            {otherUser?.email ? otherUser.email.split('@')[0] : 'Usuario'}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {conversation.guest_id === currentUserId ? 'Anfitrión' : 'Huésped'}
                        </p>
                    </div>
                </div>

                {listing && (
                    <Link 
                        href={`/listings/${listing.id}`}
                        className="flex items-center gap-3 p-2 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
                    >
                        <div className="h-10 w-14 rounded-lg overflow-hidden relative grayscale group-hover:grayscale-0 transition-all">
                            <Image
                                src={listing.image_url || 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=200'}
                                alt={listing.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{listing.title}</p>
                            <p className="text-[10px] text-gray-400">Ver anuncio</p>
                        </div>
                    </Link>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 dark:bg-zinc-950">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="p-6 rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <MessageCircle className="h-12 w-12 text-gray-200" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Inicia la conversación</p>
                            <p className="text-sm text-gray-500">Pregunta al anfitrión sobre el vehículo o las fechas disponibles.</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md ${isMe
                                        ? 'bg-black text-white rounded-br-none dark:bg-white dark:text-black font-medium'
                                        : 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-zinc-800'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                    <span className={`text-[10px] block mt-2 text-right font-bold uppercase tracking-tighter opacity-70 ${isMe ? 'text-gray-300 dark:text-gray-500' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
                <form onSubmit={handleSend} className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje aquí..."
                        className="flex-1 rounded-2xl border border-gray-200 px-6 py-4 text-sm focus:border-black focus:ring-0 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="bg-black text-white px-6 rounded-2xl hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-white/90 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    )
}
