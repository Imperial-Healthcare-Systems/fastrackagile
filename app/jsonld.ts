// Structured data (JSON-LD) for SEO. Built as a plain object and stringified
// so there's no manual escaping. Keep in sync with the live content.
const SITE = "https://fastrackagile.com";
const ORG = SITE + "/#org";

const courses: Array<{
  slug: string; name: string; desc: string; mode: "online" | "onsite";
  workload: string; price: number;
}> = [
  { slug: "practical-scrum-launchpad-weekday", name: "Practical Scrum Launchpad (Weekday)", desc: "A 4-phase Scrum Master program for non-IT professionals: learn the framework, run a 2-week Jira sprint simulation, complete mock interviews and reach placement readiness. Covers Agile, Scrum, Kanban, SAFe, Jira and Confluence.", mode: "online", workload: "P1M", price: 35000 },
  { slug: "practical-scrum-launchpad-weekend", name: "Practical Scrum Launchpad (Weekend)", desc: "The full Launchpad Scrum Master program delivered in focused Saturday & Sunday sessions for working professionals — same hands-on Jira simulation, mock interviews and placement support.", mode: "online", workload: "P90D", price: 40000 },
  { slug: "practical-scrum-interview-mastery", name: "Practical Scrum Interview Mastery", desc: "A one-week mock-practice bootcamp: real-time Scrum Master interview simulation with daily live practice, situational and behavioural questions and structured feedback.", mode: "online", workload: "P1W", price: 10000 },
  { slug: "scrum-certification-program", name: "Scrum Certification Program", desc: "An in-room, instructor-led 2-day workshop leading to a globally valid ScrumStudy Scrum Master certification, with agile games and hands-on practice.", mode: "onsite", workload: "P2D", price: 21000 },
  { slug: "scrum-growth-mentorship", name: "Scrum Growth Mentorship (On Job Support)", desc: "Personal 1:1 mentorship for pre-qualified professionals — 10 dedicated sessions, assignment-based learning and on-the-job support to grow into and beyond the Scrum Master role.", mode: "online", workload: "P30D", price: 50000 },
  { slug: "scrum-smartpath", name: "Scrum SmartPath (Self-Paced)", desc: "A 100% self-paced Scrum learning module with a full year of access to recorded sessions plus weekly live support.", mode: "online", workload: "P365D", price: 15000 },
];

const faqs: Array<[string, string]> = [
  ["I'm from a non-IT background — is this really possible for me?", "Absolutely. Companies hire Scrum Masters for leadership, communication, coordination and stakeholder management — not for coding. Professionals from operations, support, sales or any coordination role already have the core skills recruiters look for, and we help you reframe your background for IT hiring managers."],
  ["Do I need to learn coding or any technical tools first?", "No. There are no technical prerequisites. Scrum Masters are not developers — you are not expected to write code or debug applications. The role is about understanding team dynamics, tracking project progress and removing obstacles."],
  ["How long does it realistically take to transition into a Scrum Master role?", "For most working professionals it takes about 6 to 12 months, depending on your experience, effort and how consistently you apply what you learn."],
  ["What salary can I expect after becoming a Scrum Master?", "Entry-level Scrum Master roles typically range from ₹8–12 LPA, growing to ₹15–20 LPA with experience, and can go beyond ₹30 LPA at senior levels."],
  ["I'm already working full-time — can I manage this transition?", "Yes. Most of our successful learners are working professionals. The program is structured to fit around full-time jobs, families and busy schedules, with early-morning weekday and weekend batches."],
  ["Do you provide placement assistance?", "Yes — resume refinement, LinkedIn optimisation, interview coaching, mock interviews and application guidance. Your active participation and effort turn this support into offers."],
  ["Is a Scrum Master certification alone enough to get a job?", "No. Recruiters hire people who can demonstrate real-world Scrum understanding, leadership ability and interview readiness. A certificate helps, but practical training and interview practice are what get you hired."],
];

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["EducationalOrganization", "LocalBusiness"],
      "@id": ORG,
      name: "Fastrack Agile",
      alternateName: "Easy Agile Learning",
      url: SITE + "/",
      description: "Practical, mentor-led Scrum Master, Product Owner and Agile training in Hyderabad, built for non-IT professionals switching careers.",
      image: SITE + "/og-cover.jpg",
      logo: SITE + "/icon.png",
      telephone: "+91-99660-80123",
      email: "info@fastrackagile.com",
      priceRange: "₹₹",
      founder: { "@type": "Person", name: "Balaram (Ram) Choudry", jobTitle: "Founder & Lead Agile Trainer" },
      address: {
        "@type": "PostalAddress",
        streetAddress: "IndiQube Pearl, HUDA Techno Enclave, Gachibowli",
        addressLocality: "Hyderabad",
        addressRegion: "Telangana",
        postalCode: "500032",
        addressCountry: "IN",
      },
      geo: { "@type": "GeoCoordinates", latitude: 17.44, longitude: 78.3489 },
      areaServed: "IN",
      sameAs: [
        "https://www.linkedin.com/company/fastrack-agile/",
        "https://www.instagram.com/fastrackagile_official",
        "https://www.facebook.com/fastrackagile",
        "https://www.youtube.com/@Fastrack_Agile",
      ],
    },
    {
      "@type": "WebSite",
      "@id": SITE + "/#website",
      url: SITE + "/",
      name: "Fastrack Agile",
      publisher: { "@id": ORG },
      inLanguage: "en-IN",
    },
    ...courses.map((c) => ({
      "@type": "Course",
      name: c.name,
      description: c.desc,
      url: SITE + "/course/" + c.slug,
      provider: { "@id": ORG },
      inLanguage: "en-IN",
      offers: { "@type": "Offer", price: String(c.price), priceCurrency: "INR", category: "Paid", url: SITE + "/course/" + c.slug },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: c.mode,
        courseWorkload: c.workload,
        ...(c.mode === "onsite"
          ? { location: { "@type": "Place", name: "Fastrack Agile, Gachibowli", address: "Gachibowli, Hyderabad, Telangana, India" } }
          : {}),
      },
    })),
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export const JSON_LD = JSON.stringify(graph);
