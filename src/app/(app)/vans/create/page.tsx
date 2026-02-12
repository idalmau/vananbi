import { createVan } from '@/modules/vans/actions'
import { VAN_PHOTO_TYPES } from '@/modules/vans/types'

export default function CreateVanPage() {
    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen py-12">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Registrar Nuevo Vehículo</h1>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow border border-gray-200 dark:border-zinc-800">
                    <form action={createVan} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marca</label>
                                <input name="make" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2" placeholder="Ej. Volkswagen" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo</label>
                                <input name="model" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2" placeholder="Ej. California" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Año</label>
                                <input name="year" type="number" required min="1950" max={new Date().getFullYear() + 1} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2" placeholder="2020" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Matrícula</label>
                                <input name="license_plate" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 p-2" placeholder="1234 ABC" />
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-zinc-800 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Documentación</h3>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permiso de Circulación (PDF o Imagen) *</label>
                                <input type="file" name="registration_file" required accept=".pdf,image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-zinc-800 dark:file:text-white" />
                                <p className="mt-1 text-xs text-gray-500">Este documento es necesario para verificar la propiedad del vehículo. No será público.</p>
                            </div>

                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fotos del Vehículo</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {VAN_PHOTO_TYPES.map((type) => (
                                    <div key={type.value}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{type.label}</label>
                                        <input type="file" name={`photo_${type.value}`} accept="image/*" className="block w-full text-xs text-gray-500" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6">
                            <button type="submit" className="w-full justify-center bg-black text-white px-4 py-3 rounded-lg font-bold hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors">
                                Registrar Vehículo
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
