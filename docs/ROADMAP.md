# MVP Gap Analysis & Roadmap

## Current Status
The application serves as a functional prototype with core flows (Auth, Booking, Search, Dashboard) implemented. However, several critical components are simulated or "happy-path" only, making it unsuitable for a public launch.

## Missing Feature Analysis

| Feature | Status | Value (MVP) | Difficulty | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Real Payments** | ⚠️ Simulated | 🔴 Critical | High | Currently, payments are mocked. Need to implement Stripe Elements/Checkout, webhooks for status updates, and payout onboarding (Connect) for hosts. |
| **Image Hosting** | ⚠️ Mock URLs | 🔴 Critical | Medium | Listings use a single external URL string. Need Supabase Storage bucket, multi-image upload UI, and DB schema update (`listing_images` table). |
| **Dynamic Amenities** | ❌ Missing | 🟠 High | Lo/Med | Listings display hardcoded static amenities. Need `amenities` table, `listing_amenities` join table, and Host UI to select them. |
| **Email Notifications** | ❌ Missing | 🟠 High | Low | No emails sent on booking/confirmation. Need Resend.com or similar integration for transactional emails. |
| **Host Parameters** | ⚠️ Fixed | 🟡 Medium | Low | Hosts can't define rules (pets, smoking), check-in times, or cancel policies. Fields exist in UI but might not be in DB/Form. |
| **Deployment** | ❌ Missing | 🔴 Critical | Medium | App runs locally. Needs Vercel/Netlify setup, env var configuration, and Supabase production instance. |
| **Responsive UI** | ✅ Good | 🟡 Medium | Medium | UI is mostly responsive but map view and complex forms need mobile testing. |

## Proposed Roadmap

### Phase 1: Trust & Transactions (Critical for Launch)
1.  **Stripe Integration**: Replace mock payment with real Stripe Payment Intents.
2.  **Image Uploads**: Implement Supabase Storage for reliable image hosting and support 3-5 images per listing.
3.  **Deployment Pipeline**: Set up Vercel deployment to test on real devices.

### Phase 2: Listing Depth (Better UX)
4.  **Dynamic Amenities**: Allow hosts to select specific amenities (Wifi, Shower, Kitchen, etc.).
5.  **Host Rules & Parameters**: Add House Rules and cancellation policy selection.

### Phase 3: Communication & Retention
6.  **Email Notifications**: Setup transactional emails for specific events (Booking Request, Confirmed, Cancelled).
7.  **Advanced Search**: Add filters for price range and amenities.

## Immediate Recommendation
**Focus on Phase 1**. Without real payments and user-uploaded images, the platform cannot be used by real hosts/guests.

1.  **Feature: Image Uploads** (Easier start, visual impact)
2.  **Feature: Stripe Integration** (Complex, requires API keys)
