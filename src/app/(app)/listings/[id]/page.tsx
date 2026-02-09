import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getListingById, getListingAvailability, getListingReviews } from '@/modules/listings/service'
import { createClient } from '@/shared/lib/supabase/server'
import { BookingForm } from '@/modules/booking/components/BookingForm'
import { getUserBookings } from '@/modules/booking/service'
import { ListingMap } from './components/ListingMap'
import { ListingEditableDetails } from './components/ListingEditableDetails'
import { AvailabilityManager } from '@/modules/listings/components/AvailabilityManager'

export default async function ListingPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { id } = await params
    const { startDate, endDate } = await searchParams
    const listing = await getListingById(id)
    const bookedDates = await getListingAvailability(id)
    const reviews = await getListingReviews(id)

    if (!listing) {
        notFound()
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userBookings = user ? await getUserBookings(user.id) : []

    const isOwner = user?.id === listing.host_id || false

    const bookingForm = (
        <BookingForm
            listing={listing}
            user={user}
            bookedDates={bookedDates}
            initialStartDate={typeof startDate === 'string' ? startDate : ''}
            initialEndDate={typeof endDate === 'string' ? endDate : ''}
            userBookings={userBookings}
        />
    )

    return (
        <div className="bg-white dark:bg-black min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
                <ListingEditableDetails
                    listing={listing}
                    bookingForm={bookingForm}
                    isOwner={isOwner}
                    bookedDates={bookedDates}
                    reviews={reviews}
                />
            </div>
        </div>
    )
}
