import { createClient } from '@/shared/lib/supabase/server'
import { Profile } from '@/modules/auth/types'

export async function getProfileById(id: string): Promise<Profile | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }

    return data as Profile
}
