
'use client'

import { useActionState } from 'react'
import { login } from '@/modules/auth/actions'
import { cn } from '@/shared/lib/utils'

const initialState = {
    error: '',
}

export function LoginForm({ next }: { next?: string }) {
    // Using useActionState (standard in Next.js 15, polyfilled or aliased in some 14 setups, 
    // but let's stick to standard React 19 hooks if available or use a simple transition wrapper).
    // Since we are on Next.js 16 (per package.json), we can use React 19 hooks.
    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        return login(formData);
    }, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-4 w-full max-w-sm mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Bienvenido de nuevo</h2>

            {next && <input type="hidden" name="next" value={next} />}

            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-200">Correo electrónico</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700"
                    placeholder="tu@email.com"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-200">Contraseña</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700"
                    placeholder="••••••••"
                />
            </div>

            {state?.error && (
                <p className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">{state.error}</p>
            )}

            <button
                type="submit"
                disabled={isPending}
                className={cn(
                    "mt-2 w-full py-2 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200 active:scale-95 transition-transform",
                    isPending && "cursor-not-allowed"
                )}
            >
                {isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
                ¿No tienes una cuenta? <a href="/signup" className="text-blue-600 hover:underline">Regístrate</a>
            </p>
        </form>
    )
}
