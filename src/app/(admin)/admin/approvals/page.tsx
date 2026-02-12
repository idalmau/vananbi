import { getPendingVans, approveVan, rejectVan } from '@/modules/admin/actions'
import Image from 'next/image'

export default async function AdminApprovalsPage() {
    const pendingVans = await getPendingVans()

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Revisiones Pendientes</h1>

                {pendingVans.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-12 text-center border border-gray-200 dark:border-zinc-800">
                        <p className="text-gray-500">No hay vehículos pendientes de revisión.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pendingVans.map((van) => (
                            <div key={van.id} className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow border border-gray-200 dark:border-zinc-800">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {van.make} {van.model} ({van.year})
                                            </h3>
                                            <p className="text-sm text-gray-500">Matrícula: {van.license_plate}</p>
                                            <p className="text-sm text-gray-500">Host: {van.host?.first_name} {van.host?.last_name} ({van.host?.email})</p>
                                        </div>

                                        <div className="flex gap-4">
                                            <form action={approveVan.bind(null, van.id)}>
                                                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium">
                                                    Aprobar
                                                </button>
                                            </form>
                                            <form action={rejectVan.bind(null, van.id, 'Documentación incorrecta')}>
                                                <button type="submit" className="text-red-600 border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-md font-medium shadow-sm">
                                                    Rechazar
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        {van.photos?.map((photo) => (
                                            <div key={photo.id} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                <Image src={photo.url} alt={photo.type} fill className="object-cover" />
                                                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                    {photo.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
