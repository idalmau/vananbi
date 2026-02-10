'use server'

import { createClient } from '@/shared/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadAvatar(formData: FormData) {
    const supabase = await createClient()

    // 1. Verify User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const file = formData.get('file') as File
    if (!file) {
        return { error: 'No file uploaded' }
    }

    // 2. Validate File (Size & Type)
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return { error: 'File size too large (max 5MB)' }
    }

    if (!file.type.startsWith('image/')) {
        return { error: 'Invalid file type' }
    }

    // 3. Upload to Storage
    // Path: {userId}/avatar-{timestamp}.ext
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
            upsert: true
        })

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: 'Failed to upload image' }
    }

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

    // 5. Update Profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

    if (updateError) {
        console.error('Profile update error:', updateError)
        return { error: 'Failed to update profile' }
    }

    revalidatePath('/profile')
    return { success: true, url: publicUrl }
}
