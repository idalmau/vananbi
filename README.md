# Vananbi

Vananbi is a peer-to-peer campervan accommodation rental platform, enabling users to list their vehicles and guests to book them for their adventures.

## Features

-   **Authentication**: Secure signup/login for Hosts and Guests using Supabase Auth.
-   **Listings**: Hosts can publish vehicle listings with details, prices, and availability.
-   **Search**: Guests can search for available vans (date filtering and filtering by properties).
-   **Booking Engine**:
    -   Real-time date selection with overlap validation.
    -   Self-overlap protection (prevents double-booking yourself).
    -   Dynamic price calculation based on duration.
    -   Booking management (confirmation and cancellation).
-   **Dashboard**: Dedicated panels for Hosts (manage listings/bookings) and Guests (my trips).
-   **Internationalization**: Fully localized in Spanish (ES).

## Tech Stack

-   **Framework**: Next.js 14+ (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Database & Auth**: Supabase
-   **Icons**: Lucide React

## Getting Started

### Prerequisites

-   Node.js 18+
-   npm
-   A Supabase project (URL and Anon Key)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/vananbi.git
    cd vananbi
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  Database Setup:
    Run the SQL scripts located in `src/db/` in your Supabase SQL Editor:
    -   `schema.sql`: Sets up tables, RLS policies, and triggers.
    -   `seed.sql`: (Optional) Populates the DB with initial mock data.

5.  Run the development server:
    ```bash
    npm run dev
    ```

6.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

-   `src/app`: Application routes and pages.
-   `src/modules`: Feature-based modules (Auth, Booking, Listings, Payments).
-   `src/shared`: Shared components and utilities.
-   `src/db`: Database schemas and seed data.

## Trade-offs and Decisions

See [docs/tradeoffs.md](docs/tradeoffs.md) for a detailed log of architectural decisions.
