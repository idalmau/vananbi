'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/shared/lib/supabase/client' // client component supabase
import { sendMessage, markAsRead } from '@/modules/chat/actions'
import { Send, MessageCircle, X } from 'lucide-react'

interface Message {
    id: string
    content: string
    sender_id: string
    created_at: string
}

interface BookingChatProps {
    bookingId: string
    initialMessages: Message[]
    currentUserId: string
    startOpen?: boolean
}

export function BookingChat({ bookingId, initialMessages, currentUserId, startOpen = false }: BookingChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isOpen, setIsOpen] = useState(startOpen)
    const [hasUnread, setHasUnread] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        // Subscribe to new messages
        const channel = supabase
            .channel(`booking-chat:${bookingId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `booking_id=eq.${bookingId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    setMessages((prev) => [...prev, newMsg])

                    if (!isOpen && newMsg.sender_id !== currentUserId) {
                        setHasUnread(true)
                    }

                    // Scroll to bottom on new message
                    if (isOpen) {
                        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [bookingId, supabase, isOpen, currentUserId])

    // Scroll to bottom on open + Mark as Read
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)
            setHasUnread(false)
            markAsRead(bookingId)
        }
    }, [isOpen, bookingId])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isSending) return

        setIsSending(true)
        const content = newMessage
        setNewMessage('')

        const result = await sendMessage(bookingId, content)
        setIsSending(false)

        if (result?.error) {
            alert('Error sending message')
            setNewMessage(content)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-black text-white p-4 rounded-full shadow-xl hover:bg-gray-800 hover:scale-105 transition-all flex items-center gap-2 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
                <div className="relative">
                    <MessageCircle className="h-6 w-6" />
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-white"></span>
                    )}
                </div>
                <span className="font-semibold hidden sm:inline">Chat</span>
            </button>
        )
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Chat</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-zinc-900">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 text-sm space-y-2">
                        <MessageCircle className="h-8 w-8 opacity-20" />
                        <p>No hay mensajes todavía.<br />¡Envía un saludo!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-zinc-700'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                    <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="bg-black text-white p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    )
}
