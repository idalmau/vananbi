'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Van, VanStatus } from './types'

export async function createVan(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Debes iniciar sesión para registrar un vehículo')
    }

    const start = performance.now() // Start timer

    const make = formData.get('make') as string
    const model = formData.get('model') as string
    const year = parseInt(formData.get('year') as string)
    const licensePlate = formData.get('license_plate') as string

    // Insert Van
    const { data: van, error: insertError } = await supabase
        .from('vans')
        .insert({
            host_id: user.id,
            make,
            model,
            year,
            license_plate: licensePlate,
            status: 'pending', // Default status
        })
        .select()
        .single()

    if (insertError) {
        throw new Error('Error al registrar el vehículo: ' + insertError.message)
    }

    // Upload Registration Document (Required)
    const registrationFile = formData.get('registration_file') as File
    if (registrationFile && registrationFile.size > 0) {
        const fileExt = registrationFile.name.split('.').pop()
        const filePath = `${van.id}/registration.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('van-docs') // Ensure bucket exists
            .upload(filePath, registrationFile)

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
                .from('van-docs')
                .getPublicUrl(filePath)

            await supabase.from('van_photos').insert({
                van_id: van.id,
                url: publicUrl,
                type: 'registration'
            })
        }
    }

    // Upload Photos (Optional but recommended)
    const photoTypes = ['front', 'back', 'side', 'interior']
    const uploadPromises = photoTypes.map(async (type) => {
        const file = formData.get(`photo_${type}`) as File
        if (file && file.size > 0) {
            const fileExt = file.name.split('.').pop()
            const filePath = `${van.id}/${type}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('van-photos') // Separate bucket for public photos? Or reuse listing bucket logic?
                .upload(filePath, file)

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('van-photos')
                    .getPublicUrl(filePath)

                await supabase.from('van_photos').insert({
                    van_id: van.id,
                    url: publicUrl,
                    type: type
                })
            }
        }
    })

    await Promise.all(uploadPromises)

    revalidatePath('/dashboard')
    redirect('/dashboard?tab=vehicles')
}

export async function getHostVans(hostId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('vans')
        .select(`
            *,
            photos:van_photos(*)
        `)
        .eq('host_id', hostId)
        .order('created_at', { ascending: false })

    return (data as Van[]) || []
}

export async function getVan(vanId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('vans')
        .select(`
            *,
            photos:van_photos(*)
        `)
        .eq('id', vanId)
        .single()

    return data as Van
}

export async function getApprovedVans(hostId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('vans')
        .select('id, make, model, license_plate')
        .eq('host_id', hostId)
        .eq('status', 'approved')

    return data || []
}
