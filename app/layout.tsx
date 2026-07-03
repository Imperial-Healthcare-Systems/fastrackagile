import type { Metadata, Viewport } from "next";
import { JSON_LD } from "./jsonld";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://easyagilelearning.com"),
  title:
    "Scrum Master Training in Hyderabad for Non-IT Professionals | Easy Agile Learning",
  description:
    "Practical, mentor-led Scrum Master training in Hyderabad built for non-IT professionals. Live Jira sprint simulation, mock interviews and placement guidance. Rated 5.0 by 73 learners.",
  authors: [{ name: "Easy Agile Learning" }],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, "max-image-preview": "large" } as Metadata["robots"],
  openGraph: {
    type: "website",
    siteName: "Easy Agile Learning",
    title: "Scrum Master Training in Hyderabad for Non-IT Professionals",
    description:
      "Practical, mentor-led Scrum Master training — live Jira sprint simulation, mock interviews, placement guidance. Rated 5.0 by 73 learners.",
    url: "https://easyagilelearning.com/",
    images: ["https://easyagilelearning.com/assets/og-cover.jpg"],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrum Master Training in Hyderabad for Non-IT Professionals",
    description:
      "Practical Scrum Master training with live Jira simulation & mock interviews. Rated 5.0 by 73 learners.",
    images: ["https://easyagilelearning.com/assets/og-cover.jpg"],
  },
  other: {
    "geo.region": "IN-TG",
    "geo.placename": "Gachibowli, Hyderabad",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON_LD }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
