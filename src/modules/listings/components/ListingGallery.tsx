'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ListingImage } from '@/modules/listings/types'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ListingGalleryProps {
    images: ListingImage[]
    coverUrl: string | null
    title: string
}

export function ListingGallery({ images, coverUrl, title }: ListingGalleryProps) {
    const [showLightbox, setShowLightbox] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    // Combine cover (if not in images?) or just use images.
    // Logic: If images exist, use them. If not, use coverUrl as fallback.
    // If coverUrl is external and images are internal, we might want to show both?
    // Let's assume images[] is the source of truth if populated.
    // If valid images array is empty, show coverUrl.

    const displayImages = images.length > 0
        ? images.map(img => img.url)
        : (coverUrl ? [coverUrl] : [])

    if (displayImages.length === 0) {
        return (
            <div className="aspect-video w-full bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400">
                Sin imágenes disponibles
            </div>
        )
    }

    const openLightbox = (index: number) => {
        setCurrentIndex(index)
        setShowLightbox(true)
    }

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex((prev) => (prev + 1) % displayImages.length)
    }

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
    }

    return (
        <>
            {/* Dynamic Grid View */}
            <div className="h-[400px] rounded-2xl overflow-hidden">
                {displayImages.length === 1 && (
                    <div
                        className="w-full h-full relative cursor-pointer group"
                        onClick={() => openLightbox(0)}
                    >
                        <Image
                            src={displayImages[0]}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority
                            unoptimized
                        />
                    </div>
                )}

                {displayImages.length === 2 && (
                    <div className="grid grid-cols-2 gap-2 h-full">
                        {displayImages.map((url, idx) => (
                            <div
                                key={idx}
                                className="relative h-full cursor-pointer group overflow-hidden"
                                onClick={() => openLightbox(idx)}
                            >
                                <Image
                                    src={url}
                                    alt={`${title} ${idx + 1}`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    unoptimized
                                />
                            </div>
                        ))}
                    </div>
                )}

                {(displayImages.length === 3 || displayImages.length === 4) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-full">
                        {/* Main Image */}
                        <div
                            className="md:col-span-2 relative h-full cursor-pointer group overflow-hidden"
                            onClick={() => openLightbox(0)}
                        >
                            <Image
                                src={displayImages[0]}
                                alt={title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                priority
                                unoptimized
                            />
                        </div>
                        {/* Side Column */}
                        <div className="flex flex-col gap-2 h-full">
                            {displayImages.slice(1).map((url, idx) => (
                                <div
                                    key={idx}
                                    className="relative h-full cursor-pointer group overflow-hidden"
                                    onClick={() => openLightbox(idx + 1)}
                                >
                                    <Image
                                        src={url}
                                        alt={`${title} ${idx + 2}`}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {displayImages.length >= 5 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-full">
                        <div
                            className="md:col-span-2 h-full relative cursor-pointer group overflow-hidden"
                            onClick={() => openLightbox(0)}
                        >
                            <Image
                                src={displayImages[0]}
                                alt={title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                priority
                                unoptimized
                            />
                        </div>
                        <div className="hidden md:grid grid-cols-1 gap-2 h-full">
                            {displayImages.slice(1, 3).map((url, idx) => (
                                <div
                                    key={idx}
                                    className="relative h-full cursor-pointer group overflow-hidden"
                                    onClick={() => openLightbox(idx + 1)}
                                >
                                    <Image
                                        src={url}
                                        alt={`${title} ${idx + 2}`}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="hidden md:grid grid-cols-1 gap-2 h-full">
                            {displayImages.slice(3, 5).map((url, idx) => (
                                <div
                                    key={idx}
                                    className="relative h-full cursor-pointer group overflow-hidden"
                                    onClick={() => openLightbox(idx + 3)}
                                >
                                    <Image
                                        src={url}
                                        alt={`${title} ${idx + 4}`}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    {idx === 1 && displayImages.length > 5 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                                            +{displayImages.length - 5}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={() => openLightbox(0)}
                className="md:hidden absolute bottom-4 right-4 bg-white/90 text-black px-3 py-1 rounded-lg text-sm font-semibold shadow-sm backdrop-blur-sm"
            >
                Ver todas las fotos
            </button>

            {/* Lightbox */}
            {showLightbox && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center backdrop-blur-md">
                    <button
                        onClick={() => setShowLightbox(false)}
                        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
                    >
                        <X className="h-8 w-8" />
                    </button>

                    <button
                        onClick={prevImage}
                        className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full"
                    >
                        <ChevronLeft className="h-10 w-10" />
                    </button>

                    <div className="relative h-[80vh] w-[90vw] max-w-7xl">
                        <Image
                            src={displayImages[currentIndex]}
                            alt={title}
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>

                    <button
                        onClick={nextImage}
                        className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full"
                    >
                        <ChevronRight className="h-10 w-10" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-medium">
                        {currentIndex + 1} / {displayImages.length}
                    </div>
                </div>
            )}
        </>
    )
}
