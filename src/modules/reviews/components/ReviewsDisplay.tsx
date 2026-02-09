import { Star, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Review } from '@/modules/reviews/types'
import { cn } from '@/shared/lib/utils'

interface ReviewsDisplayProps {
    reviews: Review[]
}

export function ReviewsDisplay({ reviews }: ReviewsDisplayProps) {
    if (reviews.length === 0) {
        return (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <p>Aún no hay valoraciones para este anuncio.</p>
            </div>
        )
    }

    const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length

    return (
        <section className="space-y-8">
            <div className="flex items-baseline gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-2">
                    <Star className="w-8 h-8 fill-black text-black dark:fill-white dark:text-white" />
                    <span className="text-3xl font-bold dark:text-white">
                        {averageRating.toFixed(1)}
                    </span>
                </div>
                <span className="text-lg text-gray-500 dark:text-gray-400">
                    {reviews.length} {reviews.length === 1 ? 'valoración' : 'valoraciones'}
                </span>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {reviews.map((review) => (
                    <div key={review.id} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                {review.guest?.avatar_url ? (
                                    <img
                                        src={review.guest.avatar_url}
                                        alt={review.guest.full_name || 'Guest'}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <User className="w-6 h-6 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {review.guest?.full_name || 'Usuario'}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{format(new Date(review.created_at), 'MMMM yyyy', { locale: es })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        "w-4 h-4",
                                        i < review.rating
                                            ? "fill-black text-black dark:fill-white dark:text-white"
                                            : "text-gray-200 dark:text-zinc-800"
                                    )}
                                />
                            ))}
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {review.comment}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}
