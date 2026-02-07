
'use client'

import { useActionState } from 'react'
import { signup } from '@/modules/auth/actions'
import { cn } from '@/shared/lib/utils'

const initialState = {
    error: '',
}

export function SignupForm() {
    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        return signup(formData);
    }, initialState);

    return (
        <form action={formAction} className="flex flex-col gap-4 w-full max-w-sm mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Crear Cuenta</h2>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="first_name" className="text-sm font-medium text-gray-700 dark:text-gray-200">Nombre</label>
                    <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        required
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700"
                        placeholder="Juan"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="last_name" className="text-sm font-medium text-gray-700 dark:text-gray-200">Apellidos</label>
                    <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        required
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700"
                        placeholder="Pérez"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-200">Nombre de usuario</label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700"
                    placeholder="juanperez"
                />
            </div>

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

            <div className="flex flex-col gap-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-200">Soy un...</label>
                <select
                    id="role"
                    name="role"
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-700"
                >
                    <option value="guest">Huésped (Quiero reservar)</option>
                    <option value="host">Host (Quiero publicar)</option>
                </select>
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
                {isPending ? 'Creando cuenta...' : 'Registrarse'}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
                ¿Ya tienes una cuenta? <a href="/login" className="text-blue-600 hover:underline">Inicia sesión</a>
            </p>
        </form>
    )
}
