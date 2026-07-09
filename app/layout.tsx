import type { Metadata, Viewport } from "next";
import { JSON_LD } from "./jsonld";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const SITE = "https://fastrackagile.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default:
      "Scrum Master Training in Hyderabad for Non-IT Professionals | Fastrack Agile",
    template: "%s | Fastrack Agile",
  },
  description:
    "Fastrack Agile (formerly Easy Agile Learning) — practical, mentor-led Scrum Master and Product Owner training in Hyderabad, built for non-IT professionals switching careers. Live Jira sprint simulations, mock interviews, and placement support. Led by Ram Choudry.",
  keywords: [
    "Scrum Master training Hyderabad",
    "Scrum Master course for non-IT",
    "career switch to Scrum Master",
    "Agile training Hyderabad",
    "Product Owner training",
    "Scrum certification ScrumStudy",
    "CSM PSM training India",
    "Jira sprint simulation",
    "mock interview Scrum Master",
    "Fastrack Agile",
    "Easy Agile Learning",
    "Ram Choudry",
  ],
  applicationName: "Fastrack Agile",
  authors: [{ name: "Fastrack Agile" }],
  creator: "Fastrack Agile",
  publisher: "Fastrack Agile",
  category: "education",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  } as Metadata["robots"],
  openGraph: {
    type: "website",
    siteName: "Fastrack Agile",
    title: "Scrum Master Training in Hyderabad for Non-IT Professionals",
    description:
      "Practical, mentor-led Scrum Master training for non-IT professionals — live Jira sprint simulations, mock interviews and placement support. Formerly Easy Agile Learning.",
    url: SITE + "/",
    images: [
      { url: "/og-cover.jpg", width: 1200, height: 630, alt: "Fastrack Agile — Scrum Master training community in Hyderabad" },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrum Master Training in Hyderabad for Non-IT Professionals",
    description:
      "Practical Scrum Master training for non-IT professionals — live Jira simulations, mock interviews & placement support. Fastrack Agile, Hyderabad.",
    images: ["/og-cover.jpg"],
  },
  other: {
    "geo.region": "IN-TG",
    "geo.placename": "Gachibowli, Hyderabad",
    "geo.position": "17.4400;78.3489",
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
