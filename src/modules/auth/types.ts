
export type UserRole = 'guest' | 'host'

export type Profile = {
    id: string
    email: string
    role: UserRole
    created_at: string
    first_name?: string
    last_name?: string
    username?: string
    avatar_url?: string
    about?: string
    response_rate?: number
    response_time?: string
    languages?: string[]
}
