# Vananbi MVP - Trade-offs & Strategic Decisions

This document outlines the key technical and product decisions made during the construction of the Vananbi MVP. It is intended to provide investors and stakeholders with the rationale behind our "Validation-First" approach.

---

## 1. Product & UX

### Single Landing Page vs. Dual Role-Based Pages
- **Decision:** Use a single, adaptive landing page for both Guests and Hosts.
- **Why:** Speed of delivery. Managing two separate marketing funnels (routing, separate content, SEO) double the engineering effort.
- **Trade-off:** We lose some targeted messaging power for new Host acquisition.
- **Mitigation:** The page adapts dynamically. If a user is already a Host, the CTA changes to "Go to my listings". We can add a dedicated `/become-host` page later without replatforming.

### "No-Wifi" Default
- **Decision:** Explicitly market the lack of Wifi as a feature ("Digital Detox").
- **Why:** Aligns with the "Van Life" value prop of disconnection and nature. Also simplifies initial search filters.

---

## 2. Architecture & Performance

### Server Components vs. Client-Side API
- **Decision:** Fetch data directly in Server Components (RSC) instead of building a REST API for the frontend.
- **Why:** 
    - **Performance:** Zero "waterfalls" or loading spinners for initial content. Better SEO.
    - **Security:** Database logic stays on the server; no public API to secure.
    - **Velocity:** We write one function instead of an endpoint + a fetch hook + a state manager.
- **Trade-off:** Slightly harder to add a mobile app later (since there is no public API yet).
- **Mitigation:** We can expose the existing Service functions via API Routes easily when a mobile app is needed.

### Supabase (BaaS) vs. Custom Backend
- **Decision:** Use Supabase for Auth, Database, and Image Storage.
- **Why:** Saves weeks of boilerplate work on authentication flows, email verification, and database hosting.
- **Trade-off:** Vendor lock-in (harder to migrate away from Supabase specific features like RLS).

---

## 3. Data & Security

### Secure "Server-Server" Requests
- **Decision:** All data fetching happens server-to-server with forwarded Auth Cookies.
- **Why:** This leverages the database's Row Level Security (RLS) directly. The database knows *exactly* who the user is without us writing custom middleware checks.

### Mock Data Seeding
- **Decision:** Use a SQL seed script + DiceBear avatars instead of a complex admin CMS.
- **Why:** Allows us to demo a "full" platform immediately without manually creating 50 listings. DiceBear generates consistent avatars based on IDs, making the demo look deterministic and polished.
