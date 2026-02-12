
'use client'

import { useActionState, useState } from 'react'
import { createListing } from '@/modules/listings/actions'
import { cn } from '@/shared/lib/utils'
import { X } from 'lucide-react'

const initialState = {
    error: '',
}


import { Van } from '@/modules/vans/types'

export function CreateListingForm({ vans }: { vans: Pick<Van, 'id' | 'make' | 'model' | 'license_plate'>[] }) {
    const [previews, setPreviews] = useState<string[]>([])
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])

    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        // Append manually managed files
        // Note: The input[type="file"] might simulate sending files if not cleared, 
        // but since we clear it, we must add them here.
        // Also remove any 'images' that might have come from the input (if any) to avoid duplicates is tricky with FormData,
        // but if input is cleared, it sends nothing (or empty).

        // We append with the same name 'images'. Server action expects getAll('images').
        selectedFiles.forEach(file => {
            formData.append('images', file)
        })

        return createListing(prev, formData);
    }, initialState);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setSelectedFiles(prev => [...prev, ...newFiles])

            const newPreviews = newFiles.map(file => URL.createObjectURL(file))
            setPreviews(prev => [...prev, ...newPreviews])

            // Clear input so same file can be selected again if needed
            e.target.value = ''
        }
    }

    const removeImage = (index: number) => {
        setPreviews(prev => {
            const newPreviews = [...prev]
            URL.revokeObjectURL(newPreviews[index]) // Cleanup
            newPreviews.splice(index, 1)
            return newPreviews
        })
        setSelectedFiles(prev => {
            const newFiles = [...prev]
            newFiles.splice(index, 1)
            return newFiles
        })
    }

    return (
        <form action={formAction} className="space-y-6 max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crear un Nuevo Alojamiento</h2>
                <p className="text-gray-500 dark:text-gray-400">Comparte tu espacio con el mundo.</p>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="vanId" className="text-sm font-medium text-gray-700 dark:text-gray-200">Vehículo</label>
                        <select
                            id="vanId"
                            name="vanId"
                            required
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                        >
                            <option value="">Selecciona un vehículo...</option>
                            {vans.map(van => (
                                <option key={van.id} value={van.id}>
                                    {van.make} {van.model} ({van.license_plate})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500">Solo se muestran tus vehículos aprobados.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-200">Título</label>
                        <input
                            id="title"
                            name="title"
                            required
                            maxLength={100}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                            placeholder="ej. Caravana acogedora en Rías Baixas"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-200">Ubicación</label>
                        <input
                            id="location"
                            name="location"
                            required
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                            placeholder="ej. Portosín, Galicia"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="price" className="text-sm font-medium text-gray-700 dark:text-gray-200">Precio por noche (€)</label>
                        <input
                            id="price"
                            name="price"
                            type="number"
                            min="1"
                            step="0.01"
                            required
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                            placeholder="100.00"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="images" className="text-sm font-medium text-gray-700 dark:text-gray-200">Fotos (Opcional)</label>
                        <div className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                id="images"
                                name="images"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image-plus h-8 w-8 text-gray-400"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" /><line x1="16" x2="22" y1="5" y2="5" /><line x1="19" x2="19" y1="2" y2="8" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Selecciona o arrastra fotos aquí</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">Puedes subir más después</span>
                            </div>
                        </div>
                        {previews.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {previews.map((src, index) => (
                                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-200 dark:border-zinc-700 group">
                                        <img src={src} alt={`Preview ${index}`} className="object-cover w-full h-full" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="imageUrl" className="text-sm font-medium text-gray-700 dark:text-gray-200">URL de la Imagen (Opcional)</label>
                        <input
                            id="imageUrl"
                            name="imageUrl"
                            type="url"
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                            placeholder="https://images.unsplash.com/..."
                        />
                        <p className="text-xs text-gray-500">Alternativa: Usa una URL directa si prefieres.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200">Descripción</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                            placeholder="Describe tu oferta..."
                        />
                    </div>
                </div>
            </div>

            {state?.error && (
                <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">{state.error}</p>
            )}

            <button
                type="submit"
                disabled={isPending}
                className={cn(
                    "w-full py-3 px-4 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200",
                    isPending && "cursor-not-allowed"
                )}
            >
                {isPending ? 'Creando...' : 'Crear Alojamiento'}
            </button>
        </form>
    )
}
