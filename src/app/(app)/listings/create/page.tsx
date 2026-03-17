import { CreateListingForm } from '@/modules/listings/components/CreateListingForm'
import { getApprovedVans } from '@/modules/vans/actions'
import { createClient } from '@/shared/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CreateListingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'host') {
        redirect('/profile')
    }

    const approvedVans = await getApprovedVans(user.id)

    if (approvedVans.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 p-8 rounded-xl border border-gray-200 dark:border-zinc-800 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Primero registra tu vehículo</h2>
                    <p className="text-gray-500 mb-8">Para publicar un anuncio, necesitas tener un vehículo aprobado por nuestros administradores.</p>
                    <Link href="/vans/create" className="block w-full py-3 px-4 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200">
                        Registrar Vehículo
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
            <CreateListingForm vans={approvedVans} />
        </div>
    )
}
