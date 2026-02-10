'use client'

import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { User as UserIcon, LogOut } from 'lucide-react'
import { signout } from '@/modules/auth/actions'

interface UserMenuProps {
    user: any
    avatarUrl?: string | null
}

export function UserMenu({ user, avatarUrl }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <div className="flex items-center justify-center p-1 rounded-full text-gray-700 hover:text-black hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                {avatarUrl ? (
                    <div className="h-8 w-8 relative rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700">
                        <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                    </div>
                ) : (
                    <div className="p-1">
                        <UserIcon className="h-6 w-6" />
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="absolute right-0 mt-0 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 py-1 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.email}
                        </p>
                    </div>

                    <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                        Perfil
                    </Link>

                    <form action={signout} className="block w-full">
                        <button
                            type="submit"
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 text-left"
                        >
                            <LogOut className="h-4 w-4" />
                            Cerrar sesión
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}
