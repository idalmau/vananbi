
import { LoginForm } from '@/modules/auth/components/LoginForm'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { next } = await searchParams
    const nextUrl = typeof next === 'string' ? next : undefined

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
            <LoginForm next={nextUrl} />
        </div>
    )
}
