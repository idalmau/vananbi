import { redirect } from 'next/navigation'
import { createClient } from '@/shared/lib/supabase/server'
import { getUserBookings } from '@/modules/booking/service'
import { BookingList } from '@/modules/booking/components/BookingList'

export default async function TripsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const myBookings = await getUserBookings(user.id)

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Viajes</h1>
                </div>
                <BookingList bookings={myBookings} />
            </div>
        </div>
    )
}
