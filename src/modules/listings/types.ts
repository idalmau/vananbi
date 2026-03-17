
export type VehicleType = 'camper' | 'motorhome' | 'caravan' | 'minivan' | 'other'
export type HandoverMethod = 'in_person' | 'automatic'

export type Listing = {
    id: string
    host_id: string
    title: string
    description: string | null
    price_per_night: number // in cents
    location: string
    latitude?: number
    longitude?: number
    image_url: string | null
    cancellation_policy_days: number
    available_from: string | null // ISO Date string
    available_to: string | null // ISO Date string
    status: 'draft' | 'published'
    van_id?: string | null
    vehicle_type?: VehicleType | null
    handover_method?: HandoverMethod | null
    rules?: string[]
    equipment?: string[]
    created_at: string
    images?: ListingImage[]
    host?: {
        email: string
        role: string
        created_at: string
        avatar_url?: string | null
        about?: string | null
        response_rate?: number
        response_time?: string
        languages?: string[]
    }
}

export type ListingImage = {
    id: string
    listing_id: string
    storage_path: string
    url: string
    position: number
    created_at: string
}

export type Option = {
    id: string
    label: string
    icon: string
}



export const VEHICLE_TYPE_OPTIONS: Option[] = [
    { id: 'camper', label: 'Camper', icon: '🚐' },
    { id: 'motorhome', label: 'Autocaravana', icon: '🏕️' },
    { id: 'caravan', label: 'Caravana', icon: '🏠' },
    { id: 'minivan', label: 'Minivan', icon: '🚗' },
    { id: 'other', label: 'Otro', icon: '🔧' },
]

export const HANDOVER_METHOD_OPTIONS: Option[] = [
    { id: 'in_person', label: 'En persona', icon: '🤝' },
    { id: 'automatic', label: 'Automático', icon: '🔑' },
]

export const RULE_OPTIONS: Option[] = [
    { id: 'pets', label: 'Mascotas permitidas', icon: '🐾' },
    { id: 'smoking', label: 'Fumar permitido', icon: '🚬' },
    { id: 'festivals', label: 'Festivales permitidos', icon: '🎸' },
    { id: 'age_25', label: 'Mínimo 25 años', icon: '🔞' },
    { id: 'intl_travel', label: 'Viajes internacionales', icon: '🌍' },
]

export const EQUIPMENT_OPTIONS: Option[] = [
    { id: 'bedding', label: 'Ropa de cama y toallas', icon: '🛌' },
    { id: 'outdoor_set', label: 'Mesa y sillas exterior', icon: '🪑' },
    { id: 'kitchen_kit', label: 'Menaje de cocina completo', icon: '🍴' },
    { id: 'cleaning_kit', label: 'Kit de limpieza', icon: '🧼' },
    { id: 'portable_toilet', label: 'WC Portátil (Potti)', icon: '🚽' },
    { id: 'camping_stove', label: 'Camping gas extra', icon: '🔥' },
    { id: 'leveling_blocks', label: 'Calzos niveladores', icon: '📐' },
]



