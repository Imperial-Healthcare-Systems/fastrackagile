/** @type {import('next').NextConfig} */

// The app is a single-page hash router (routes live at /#/…). If someone types
// a bare path like /admin, redirect it to the hash route so it doesn't 404.
const HASH_ROUTES = [
  "admin", "admin-login", "dashboard", "assessment", "courses", "calendar",
  "resources", "blog", "stories", "about", "contact", "login",
];

const nextConfig = {
  reactStrictMode: false, // the legacy runtime script mounts once into the DOM; avoid double-invoke in dev
  async redirects() {
    return HASH_ROUTES.map((r) => ({
      source: `/${r}`,
      destination: `/#/${r}`,
      permanent: false,
    }));
  },
};

export default nextConfig;
