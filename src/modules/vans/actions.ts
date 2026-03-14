'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createVanSchema } from './schema'
import * as vanService from './service'
import { VanPhotoType } from './types'

export async function createVan(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Debes iniciar sesión para registrar un vehículo')
    }

    // Parse and validate with Zod
    const formValues = {
        make: formData.get('make'),
        model: formData.get('model'),
        year: formData.get('year'),
        license_plate: formData.get('license_plate'),
        registration_file: formData.get('registration_file'),
        photo_front: formData.get('photo_front'),
        photo_back: formData.get('photo_back'),
        photo_side: formData.get('photo_side'),
        photo_interior: formData.get('photo_interior'),
    }

    const parsed = createVanSchema.safeParse(formValues)

    if (!parsed.success) {
        throw new Error('Validación fallida: ' + parsed.error.issues.map(e => e.message).join(', '))
    }

    const { registration_file, photo_front, photo_back, photo_side, photo_interior, ...vanData } = parsed.data

    // 1. Create the Van Record via Service Layer
    const van = await vanService.createVanRecord(supabase, user.id, vanData)

    // 2. Upload Registration Document (Required)
    await vanService.uploadVanPhoto(supabase, van.id, registration_file, 'registration', 'van-docs')

    // 3. Upload Remaining Photos safely with Promise.allSettled
    const optionalPhotos = [
        { file: photo_front, type: 'front' as VanPhotoType },
        { file: photo_back, type: 'back' as VanPhotoType },
        { file: photo_side, type: 'side' as VanPhotoType },
        { file: photo_interior, type: 'interior' as VanPhotoType },
    ]

    const uploadPromises = optionalPhotos.map(({ file, type }) =>
        vanService.uploadVanPhoto(supabase, van.id, file, type, 'van-photos')
    )

    const results = await Promise.allSettled(uploadPromises)
    
    // Log any individual failing uploads without failing the whole request
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`Failed to upload photo type ${optionalPhotos[index].type} for van ${van.id}:`, result.reason)
        }
    })

    revalidatePath('/dashboard')
    redirect('/dashboard?tab=vehicles')
}

export async function getHostVans(hostId: string) {
    const supabase = await createClient()
    return await vanService.getHostVans(supabase, hostId)
}

export async function getVan(vanId: string) {
    const supabase = await createClient()
    return await vanService.getVan(supabase, vanId)
}

export async function getApprovedVans(hostId: string) {
    const supabase = await createClient()
    return await vanService.getApprovedVans(supabase, hostId)
}

