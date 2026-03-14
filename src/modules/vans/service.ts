import { SupabaseClient } from '@supabase/supabase-js'
import { Van, VanPhotoType } from './types'
import { CreateVanInput } from './schema'

export async function createVanRecord(
    supabase: SupabaseClient,
    userId: string,
    data: Omit<CreateVanInput, 'registration_file' | 'photo_front' | 'photo_back' | 'photo_side' | 'photo_interior'>
) {
    const { data: van, error } = await supabase
        .from('vans')
        .insert({
            host_id: userId,
            make: data.make,
            model: data.model,
            year: data.year,
            license_plate: data.license_plate,
            status: 'pending',
        })
        .select()
        .single()

    if (error) {
        throw new Error('Error al registrar el vehículo: ' + error.message)
    }

    return van as Van
}

export async function uploadVanPhoto(
    supabase: SupabaseClient,
    vanId: string,
    file: File | undefined,
    type: VanPhotoType,
    bucket: string
) {
    if (!file || file.size === 0) return null

    const fileExt = file.name.split('.').pop()
    const filePath = `${vanId}/${type}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

    if (uploadError) {
        throw new Error(`Error uploading ${type}: ` + uploadError.message)
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

    const { error: insertError } = await supabase.from('van_photos').insert({
        van_id: vanId,
        url: publicUrl,
        type: type
    })

    if (insertError) {
        throw new Error(`Error saving ${type} photo record: ` + insertError.message)
    }
    
    return publicUrl
}

export async function getHostVans(supabase: SupabaseClient, hostId: string): Promise<Van[]> {
    const { data, error } = await supabase
        .from('vans')
        .select(`
            *,
            photos:van_photos(*)
        `)
        .eq('host_id', hostId)
        .order('created_at', { ascending: false })

    if (error) throw new Error('Error fetching host vans')
    return (data as Van[]) || []
}

export async function getVan(supabase: SupabaseClient, vanId: string): Promise<Van> {
    const { data, error } = await supabase
        .from('vans')
        .select(`
            *,
            photos:van_photos(*)
        `)
        .eq('id', vanId)
        .single()

    if (error) throw new Error('Error fetching van details')
    return data as Van
}

export async function getApprovedVans(supabase: SupabaseClient, hostId: string) {
    const { data, error } = await supabase
        .from('vans')
        .select('id, make, model, license_plate')
        .eq('host_id', hostId)
        .eq('status', 'approved')

    if (error) throw new Error('Error fetching approved vans')
    return data || []
}
