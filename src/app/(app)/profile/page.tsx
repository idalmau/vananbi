import { createClient } from '@/shared/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '@/modules/auth/actions'
import { AvatarUploader } from '@/modules/profile/components/AvatarUploader'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch full profile for avatar
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { user_metadata, email } = user

    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Perfil</h1>

            <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-6">
                        <AvatarUploader
                            currentAvatarUrl={profile?.avatar_url}
                            userId={user.id}
                            size={96} // 24 * 4
                        />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {user_metadata?.first_name} {user_metadata?.last_name}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">{user_metadata?.username ? `@${user_metadata.username}` : 'Sin nombre de usuario'}</p>
                            <p className="text-sm text-gray-400 mt-1">Haz clic en la foto para cambiarla</p>
                        </div>
                    </div>

                    <div className="grid gap-6 pt-6 border-t border-gray-100 dark:border-zinc-800 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Correo Electrónico</label>
                            <p className="mt-1 text-gray-900 dark:text-white">{email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Cuenta</label>
                            <div className="mt-1 flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${user_metadata?.role === 'host' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {user_metadata?.role === 'host' ? 'Host (Anfitrión)' : 'Guest (Huésped)'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4">
                        <form action={signout}>
                            <button className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline">
                                Cerrar Sesión
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Host CTA if not host */}
            {user_metadata?.role !== 'host' && (
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
                    <h3 className="text-lg font-bold mb-2">¿Tienes una van?</h3>
                    <p className="mb-4">Conviértete en Host y empieza a ganar dinero compartiendo tu vehículo.</p>
                    <Link href="/become-host" className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-gray-900 active:scale-95 transition-transform">
                        Convertirme en Host
                    </Link>
                </div>
            )}
        </div>
    )
}
