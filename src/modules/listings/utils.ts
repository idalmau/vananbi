import { differenceInCalendarDays } from 'date-fns'

export interface DateRange {
    start_date: string
    end_date: string
    source?: 'booking' | 'block'
}

/**
 * Transforms raw booking/block ranges into DayPicker modifiers.
 * Handles the logic of inclusive start / exclusive end (checkout day).
 */
export function getAvailabilityModifiers(ranges: DateRange[]) {
    return ranges.map(range => {
        const startDate = new Date(range.start_date)
        const endDate = new Date(range.end_date)

        // Checkout day is available for new check-in.
        // Visually, the "busy" range ends one day before the checkout date.
        // Example: Booked Jan 1-3. Checkout Jan 3.
        // Jan 1: Busy. Jan 2: Busy. Jan 3: Free (for check-in).
        // Range for disabled styling: [Jan 1, Jan 2].
        endDate.setDate(endDate.getDate() - 1)

        return {
            from: startDate,
            to: endDate
        }
    })
}

/**
 * Checks if a requested range overlaps with any existing bookings/blocks.
 * Uses strict string comparison 'YYYY-MM-DD' to avoid timezone issues.
 * @param startStr YYYY-MM-DD string
 * @param endStr YYYY-MM-DD string
 * @param existingRanges List of start/end strings
 */
export function isRangeBlocked(startStr: string, endStr: string, existingRanges: DateRange[]) {
    return existingRanges.some(range => {
        // Overlap logic:
        // Request: [start, end) (Assuming end is checkout)
        // Existing: [b.start, b.end)
        // Overlap if: start < b.end AND end > b.start

        // Note: The input `endStr` from BookingForm is usually the checkout date.
        return startStr < range.end_date && endStr > range.start_date
    })
}
