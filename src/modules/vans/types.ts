
export type VanStatus = 'pending' | 'approved' | 'rejected'

export type VanPhotoType = 'registration' | 'front' | 'back' | 'side' | 'interior'

export type VanPhoto = {
    id: string
    van_id: string
    url: string
    type: VanPhotoType
    created_at: string
}

export type Van = {
    id: string
    host_id: string
    make: string
    model: string
    year: number
    license_plate: string
    status: VanStatus
    rejection_reason?: string | null
    created_at: string
    photos?: VanPhoto[]
    host?: {
        email: string
        first_name?: string
        last_name?: string
        full_name?: string
    }
}

export const VAN_PHOTO_TYPES: { value: VanPhotoType; label: string }[] = [
    { value: 'registration', label: 'Permiso de Circulación' },
    { value: 'front', label: 'Foto Frontal' },
    { value: 'back', label: 'Foto Trasera' },
    { value: 'side', label: 'Foto Lateral' },
    { value: 'interior', label: 'Foto Interior' },
]
