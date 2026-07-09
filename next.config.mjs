/** @type {import('next').NextConfig} */

// The app now uses clean URLs (real paths like /about, /course/[slug]) served by
// the catch-all route in app/[...slug]/page.tsx. The runtime SPA (public/app.js)
// reads location.pathname and renders the matching view + handles client-side nav.
const nextConfig = {
  reactStrictMode: false, // the legacy runtime script mounts once into the DOM; avoid double-invoke in dev
};

export default nextConfig;
