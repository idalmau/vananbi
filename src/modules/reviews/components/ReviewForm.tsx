'use client'

import { useState } from 'react'
import { submitReview } from '@/modules/reviews/actions'
import { Star } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ReviewFormProps {
    bookingId: string
    listingId: string
    onClose: () => void
}

export function ReviewForm({ bookingId, listingId, onClose }: ReviewFormProps) {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (rating === 0) {
            setError('Por favor, selecciona una valoración.')
            return
        }

        setIsSubmitting(true)
        setError('')

        const formData = new FormData()
        formData.append('bookingId', bookingId)
        formData.append('listingId', listingId)
        formData.append('rating', rating.toString())
        formData.append('comment', comment)

        const result = await submitReview(formData)

        if (result?.error) {
            setError(result.error)
            setIsSubmitting(false)
        } else {
            onClose()
            // Optional: Show success toast or trigger refresh
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Valorar Estancia</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={cn(
                                        "w-8 h-8 transition-colors",
                                        (hoveredRating || rating) >= star
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300 dark:text-zinc-700"
                                    )}
                                />
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                            Comentario (Opcional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent p-3 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none h-32"
                            placeholder="Cuéntanos qué tal fue tu viaje..."
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Valoración'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
