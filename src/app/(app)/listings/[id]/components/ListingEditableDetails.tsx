'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Listing } from '@/modules/listings/types'
import { ListingMap } from './ListingMap'
import { updateListing } from '@/modules/listings/actions'
import { Loader2, MapPin } from 'lucide-react'
import { AvailabilityManager } from '@/modules/listings/components/AvailabilityManager'
import { ReviewsDisplay } from '@/modules/reviews/components/ReviewsDisplay'
import { Review } from '@/modules/reviews/types'

interface ListingEditableDetailsProps {
    listing: Listing
    bookingForm: React.ReactNode
    isOwner: boolean
    bookedDates?: any[]
    reviews?: Review[]
}

export function ListingEditableDetails({ listing, bookingForm, isOwner, bookedDates = [], reviews = [] }: ListingEditableDetailsProps) {
    // ... existing state ...
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        title: listing.title,
        description: listing.description || '',
        price_per_night: listing.price_per_night,
        location: listing.location,
        image_url: listing.image_url || ''
    })

    const [viewAsGuest, setViewAsGuest] = useState(false)

    // ... handlers ...
    const handleSave = async () => {
        setIsSaving(true)
        const result = await updateListing(listing.id, formData)
        setIsSaving(false)

        if (result.success) {
            setIsEditing(false)
        } else {
            alert('Error al actualizar el anuncio')
        }
    }

    // Guest View (or Host View when not editing)
    if (!isOwner || !isEditing) {
        return (
            <>
                {/* ... Host Controls ... */}
                {isOwner && !viewAsGuest && (
                    <div className="mb-6 flex justify-end gap-2 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                        <button
                            onClick={() => setViewAsGuest(true)}
                            className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white px-3 py-1 text-sm font-medium transition-colors"
                        >
                            👁️ Ver como huésped
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        >
                            ✏️ Gestionar Anuncio
                        </button>
                    </div>
                )}

                {/* Exit Guest View Banner */}
                {isOwner && viewAsGuest && (
                    <div className="fixed bottom-4 right-4 z-50">
                        <button
                            onClick={() => setViewAsGuest(false)}
                            className="bg-black text-white px-6 py-3 rounded-full shadow-lg font-bold hover:bg-gray-800 transition-transform hover:scale-105 flex items-center gap-2"
                        >
                            🚫 Salir de la vista de huésped
                        </button>
                    </div>
                )}

                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{listing.title}</h1>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {listing.location}
                        </p>
                    </div>
                </div>

                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-200">
                    {listing.image_url ? (
                        <Image src={listing.image_url} alt={listing.title} fill className="object-cover" priority />
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">Imagen No Disponible</div>
                    )}
                </div>

                <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Host Info */}
                        <div className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-zinc-800">
                            <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                                <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.host_id}`} alt="Host" width={48} height={48} unoptimized />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Host: {listing.host?.email ? listing.host.email.split('@')[0] : 'Usuario'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Se unió en {listing.host?.created_at ? new Date(listing.host.created_at).getFullYear() : '2024'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Acerca de este vehículo</h2>
                            <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {listing.description}
                            </p>
                        </div>

                        {/* Amenities */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Lo que ofrece este vehículo</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <span>🍳 Cocina equipada</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <span>🚿 Baño portátil</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <span>🌡️ Calefacción estacionaria</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <span>🕒 Check-in flexible</span>
                                </div>
                            </div>
                        </div>

                        {/* Reviews */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Valoraciones</h2>
                            <ReviewsDisplay reviews={reviews} />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ubicación</h2>
                            <ListingMap listing={listing} />
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        {bookingForm}
                    </div>
                </div>
            </>
        )
    }

    // Edit Mode
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestionar Anuncio</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium dark:text-gray-300 dark:hover:bg-zinc-800"
                        disabled={isSaving}
                    >
                        Salir
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 flex items-center gap-2"
                    >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <div className="grid gap-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio por noche (€)</label>
                        <input
                            type="number"
                            value={formData.price_per_night / 100}
                            onChange={(e) => setFormData({ ...formData, price_per_night: Math.round(parseFloat(e.target.value) * 100) })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de Imagen</label>
                    <input
                        type="text"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                    />
                    {formData.image_url && (
                        <div className="mt-2 h-40 w-full relative rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
                            <Image src={formData.image_url} alt="Preview" fill className="object-cover" />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea
                        rows={6}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                    />
                </div>

                <div className="pt-8 border-t border-gray-200 dark:border-zinc-800">
                    <AvailabilityManager listingId={listing.id} availability={bookedDates} />
                </div>
            </div>
        </div>
    )
}
