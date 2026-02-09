
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/shared/lib/supabase/server'
import { signout } from '@/modules/auth/actions'
import { User } from 'lucide-react'
import { UserMenu } from './UserMenu'

export async function Navbar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-32 items-center">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center" scroll={true}>
                            <Image
                                src="/vananbix-logo.svg"
                                alt="Vananbi Logo"
                                width={480}
                                height={120}
                                priority
                                className="h-32 w-auto"
                            />
                        </Link>
                    </div>

                    <div className="hidden sm:flex flex-1 max-w-lg px-8">
                        <form action="/search" className="w-full relative">
                            <input
                                type="text"
                                name="destination"
                                placeholder="Buscar destinos..."
                                className="w-full bg-gray-100 border-none rounded-full py-3 px-6 pl-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </div>
                        </form>
                    </div>

                    <div className="flex items-center gap-4">


                        {user ? (
                            <div className="flex items-center gap-4">
                                {/* Host Badge */}
                                {user.user_metadata?.role === 'host' && (
                                    <>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md border border-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700">
                                            HOST
                                        </span>
                                        <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white hover:underline">
                                            Dashboard
                                        </Link>
                                    </>
                                )}

                                <Link href="/trips" className="text-sm font-medium text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white hover:underline">
                                    Viajes
                                </Link>

                                <UserMenu user={user} />
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white">
                                    Iniciar sesión
                                </Link>
                                <Link href="/signup" className="text-sm font-medium bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transaction-colors active:scale-95 transition-transform">
                                    Regístrate
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
