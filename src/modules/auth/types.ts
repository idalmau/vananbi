
export type UserRole = 'guest' | 'host'

export type Profile = {
    id: string
    email: string
    role: UserRole
    created_at: string
}
