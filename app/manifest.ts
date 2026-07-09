import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fastrack Agile — Scrum Master Training",
    short_name: "Fastrack Agile",
    description:
      "Practical, mentor-led Scrum Master and Agile training in Hyderabad for non-IT professionals.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ef",
    theme_color: "#0c1c33",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
