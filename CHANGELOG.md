# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Integrated Vercel Analytics and Speed Insights for application performance monitoring.
- Google Maps Integration for `LocationPicker` using Places Autocomplete API with Session Tokens for cost optimization.
- `GoogleMap` marker and info window display functionality alongside `LeafletMap`.
- Automatic "Panic Switch" fallback to OpenStreetMap (Leaflet & Nominatim) upon Google Maps quota exhaustion (`OVER_QUERY_LIMIT`) or missing API keys.
- `@googlemaps/js-api-loader` and `@types/google.maps` to dependencies.
- Integrated `shadcn/ui` preset system for reusable React frontend components.
- Integrated `zod` for robust Server Actions `FormData` schema validation.
- Integrated `vitest`, `jsdom`, and `@testing-library/react` for unit testing.
- Comprehensive `GEMINI.md` software standards guidelines.

### Changed
- Updated application metadata (title, description) and replaced default Next.js favicon with Vananbi logo.
- `Map.tsx` and `LocationPicker.tsx` to conditionally render Google Maps or OSM based on provider availability and quotas.
- Fixed TypeScript compilation errors related to `@googlemaps/js-api-loader` type definitions and added missing state variables to `LocationPicker.tsx`.
- Refactored Google Maps initialization to use the new functional API (`setOptions` and `importLibrary`) instead of the deprecated `Loader` class.
- Refactored `src/modules/vans/actions.ts` to utilize a strict `vans/service.ts` layer for separating business logic and database queries from HTTP actions.
- Extracted monolithic `Map.tsx` component into single-responsibility `GoogleMap.tsx` and `LeafletMap.tsx` modules.
- Extracted test suites from `src/modules` into a dedicated root-level `tests/` directory to prevent production bundling leaks.
- Replaced raw HTML anchors on the homepage with the `shadcn/ui` `Button` component.
