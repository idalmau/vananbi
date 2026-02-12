'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Validate inputs (basic validation)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Correo y contraseña son requeridos' }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    const next = formData.get('next') as string

    revalidatePath('/', 'layout')
    redirect(next || '/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as 'guest' | 'host'
    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string
    const username = formData.get('username') as string

    if (!email || !password) {
        return { error: 'Correo y contraseña son requeridos' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${siteUrl}/auth/callback`,
            data: {
                role: role || 'guest',
                first_name,
                last_name,
                username,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // If email confirmation is disabled in Supabase, this will log them in immediately.
    // Otherwise they need to check email. For MVP we assume it might work or require check.

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
