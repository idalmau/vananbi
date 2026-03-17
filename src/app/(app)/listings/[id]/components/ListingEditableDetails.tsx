'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Listing, RULE_OPTIONS, EQUIPMENT_OPTIONS } from '@/modules/listings/types'
import { ListingMap } from './ListingMap'
import { updateListing, updateListingStatus, deleteListing } from '@/modules/listings/actions'
import Link from 'next/link'

import { Loader2, MapPin, Calendar, Clock, ShieldCheck, CheckCircle2, User } from 'lucide-react'
import { AvailabilityManager } from '@/modules/listings/components/AvailabilityManager'
import { ReviewsDisplay } from '@/modules/reviews/components/ReviewsDisplay'
import { Review } from '@/modules/reviews/types'
import { ImageUploader } from '@/modules/listings/components/ImageUploader'
import { ListingGallery } from '@/modules/listings/components/ListingGallery'
import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('@/shared/components/LocationPicker').then(mod => mod.LocationPicker), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl" />
})

interface ListingEditableDetailsProps {
    listing: Listing
    bookingForm: React.ReactNode
    isOwner: boolean
    bookedDates?: any[]
    reviews?: Review[]
}

export function ListingEditableDetails({ listing, bookingForm, isOwner, bookedDates = [], reviews = [] }: ListingEditableDetailsProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [formData, setFormData] = useState({
        title: listing.title,
        description: listing.description || '',
        price_per_night: listing.price_per_night,
        location: listing.location,
        image_url: listing.image_url || '',
        latitude: listing.latitude,
        longitude: listing.longitude,
        cancellation_policy_days: listing.cancellation_policy_days || 7,
        available_from: listing.available_from || null,
        available_to: listing.available_to || null,
        available_to: listing.available_to || null,
        rules: listing.rules || [],
        equipment: listing.equipment || []
    })

    const [viewAsGuest, setViewAsGuest] = useState(false)

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
                    <div className="mb-6 flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700">
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded ${listing.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                {listing.status === 'published' ? 'Publicado' : 'Borrador'}
                            </span>
                            {listing.status !== 'published' && (
                                <span className="text-sm text-gray-500">Los huéspedes no pueden ver este anuncio.</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={async () => {
                                    const newStatus = listing.status === 'published' ? 'draft' : 'published'
                                    if (confirm(`¿Estás seguro de que quieres ${newStatus === 'published' ? 'publicar' : 'ocultar'} este anuncio?`)) {
                                        await updateListingStatus(listing.id, newStatus)
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${listing.status === 'published'
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                                    : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                                    }`}
                            >
                                {listing.status === 'published' ? 'Ocultar Anuncio' : 'Publicar Anuncio'}
                            </button>
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
                            {listing.status === 'draft' && (
                                <button
                                    onClick={async () => {
                                        if (confirm('¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.')) {
                                            setIsDeleting(true)
                                            const result = await deleteListing(listing.id)
                                            if (result?.error) {
                                                setIsDeleting(false)
                                                alert(result.error)
                                            }
                                        }
                                    }}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                    {isDeleting ? 'Eliminando...' : '🗑️ Eliminar'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Exit Guest View Banner ... */}
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

                {/* Gallery */}
                <div className="mb-8">
                    <ListingGallery
                        images={listing.images || []}
                        coverUrl={listing.image_url}
                        title={listing.title}
                    />
                </div>

                <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Compact Host Card */}
                        <div className="py-6 border-b border-gray-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
                                <Link 
                                    href={`/hosts/${listing.host_id}`}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden relative ring-2 ring-white dark:ring-zinc-700 shadow-sm transition-transform group-hover:scale-105">
                                        <Image
                                            src={listing.host?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.host_id}`}
                                            alt="Host"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-bold text-gray-900 dark:text-white group-hover:underline">
                                                Anfitrión: {listing.host?.email ? listing.host.email.split('@')[0] : 'Usuario'}
                                            </p>
                                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Ver perfil completo</p>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Acerca de este vehículo</h2>
                            <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {listing.description}
                            </p>
                        </div>

                        {/* Equipment */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Equipamiento incluido</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
                                {(listing.equipment?.length ? listing.equipment : ['bedding', 'kitchen_kit']).map(eqId => {
                                    const eq = EQUIPMENT_OPTIONS.find(e => e.id === eqId)
                                    if (!eq) return null
                                    return (
                                        <div key={eqId} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800">
                                            <span className="text-xl">{eq.icon}</span>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{eq.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Rules - "What you need to know" */}
                        <div className="p-8 rounded-3xl bg-orange-50/40 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <Clock className="h-6 w-6 text-orange-600" />
                                Lo que debes saber
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {(listing.rules?.length ? listing.rules : ['age_25']).map(ruleId => {
                                    const rule = RULE_OPTIONS.find(r => r.id === ruleId)
                                    if (!rule) return null
                                    return (
                                        <div key={ruleId} className="flex items-start gap-4">
                                            <span className="text-2xl mt-1">{rule.icon}</span>
                                            <div>
                                                <p className="text-md font-bold text-gray-900 dark:text-white leading-tight">{rule.label}</p>
                                                <p className="text-sm text-gray-500 mt-1">Consulta con el anfitrión si tienes dudas</p>
                                            </div>
                                        </div>
                                    )
                                })}
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

                {/* Image Upload Section */}
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Galería de Imágenes</h3>
                    <ImageUploader listingId={listing.id} currentImages={listing.images || []} />
                </div>

                <div className="my-6 border-t border-gray-100 dark:border-zinc-800"></div>

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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación y Mapa</label>
                    <LocationPicker
                        initialLocation={formData.location}
                        initialLat={formData.latitude}
                        initialLng={formData.longitude}
                        onLocationChange={(loc, lat, lng) => {
                            setFormData(prev => ({
                                ...prev,
                                location: loc,
                                latitude: lat,
                                longitude: lng
                            }))
                        }}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitud</label>
                        <input
                            type="number"
                            step="any"
                            value={formData.latitude || ''}
                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitud</label>
                        <input
                            type="number"
                            step="any"
                            value={formData.longitude || ''}
                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
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
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Disponibilidad General</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disponible Desde</label>
                            <input
                                type="date"
                                value={formData.available_from ? formData.available_from.split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, available_from: e.target.value || null })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disponible Hasta</label>
                            <input
                                type="date"
                                value={formData.available_to ? formData.available_to.split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, available_to: e.target.value || null })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Si dejas estas fechas vacías, el vehículo estará disponible indefinidamente.
                    </p>
                </div>

                <div className="my-6 border-t border-gray-100 dark:border-zinc-800"></div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Política de Cancelación (días antes)</label>
                    <input
                        type="number"
                        min="0"
                        max="30"
                        value={formData.cancellation_policy_days}
                        onChange={(e) => setFormData({ ...formData, cancellation_policy_days: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        El huésped podrá cancelar gratis hasta {formData.cancellation_policy_days} días antes del check-in.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de Imagen (Portada Manual)</label>
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

                <div className="my-6 border-t border-gray-100 dark:border-zinc-800"></div>

                <div className="my-6 border-t border-gray-100 dark:border-zinc-800"></div>

                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4italic">Equipamiento</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {EQUIPMENT_OPTIONS.map((opt) => {
                            const isSelected = formData.equipment?.includes(opt.id)
                            return (
                                <label key={opt.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 dark:border-zinc-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            const current = formData.equipment || []
                                            let next
                                            if (e.target.checked) {
                                                next = [...current, opt.id]
                                            } else {
                                                next = current.filter(id => id !== opt.id)
                                            }
                                            setFormData({ ...formData, equipment: next })
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {opt.icon} {opt.label}
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                </div>

                <div className="my-6 border-t border-gray-100 dark:border-zinc-800"></div>

                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Reglas</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {RULE_OPTIONS.map((opt) => {
                            const isSelected = formData.rules?.includes(opt.id)
                            return (
                                <label key={opt.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 dark:border-zinc-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            const current = formData.rules || []
                                            let next
                                            if (e.target.checked) {
                                                next = [...current, opt.id]
                                            } else {
                                                next = current.filter(id => id !== opt.id)
                                            }
                                            setFormData({ ...formData, rules: next })
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {opt.icon} {opt.label}
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                </div>

                <div className="my-6 border-t border-gray-100 dark:border-zinc-800"></div>

                <div className="my-6 border-t border-gray-100 dark:border-zinc-800"></div>

                <div className="pt-8 border-t border-gray-200 dark:border-zinc-800">
                    <AvailabilityManager listingId={listing.id} availability={bookedDates} />
                </div>

                <div className="pt-8 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
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
                        className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar Todos los Cambios
                    </button>
                </div>
            </div>
        </div>
    )
}
