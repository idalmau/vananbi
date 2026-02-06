
'use client'

import { useActionState } from 'react'
import { createListing } from '@/modules/listings/actions'
import { cn } from '@/shared/lib/utils'

const initialState = {
    error: '',
}

export function CreateListingForm() {
    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        return createListing(formData);
    }, initialState);

    return (
        <form action={formAction} className="space-y-6 max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crear un Nuevo Alojamiento</h2>
                <p className="text-gray-500 dark:text-gray-400">Comparte tu espacio con el mundo.</p>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-200">Título</label>
                        <input
                            id="title"
                            name="title"
                            required
                            maxLength={100}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                            placeholder="ej. Cabaña acogedora en el bosque"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-200">Ubicación</label>
                        <input
                            id="location"
                            name="location"
                            required
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                            placeholder="ej. Aspen, CO"
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
                        <label htmlFor="imageUrl" className="text-sm font-medium text-gray-700 dark:text-gray-200">URL de la Imagen</label>
                        <input
                            id="imageUrl"
                            name="imageUrl"
                            type="url"
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                            placeholder="https://images.unsplash.com/..."
                        />
                        <p className="text-xs text-gray-500">Para el MVP, por favor proporciona un enlace directo a la imagen.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200">Descripción</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
                            placeholder="Describe tu propiedad..."
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
                    "w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-colors disabled:opacity-50",
                    isPending && "cursor-not-allowed"
                )}
            >
                {isPending ? 'Creando...' : 'Crear Alojamiento'}
            </button>
        </form>
    )
}
