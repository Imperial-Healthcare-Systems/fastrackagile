import { NextResponse } from "next/server";

// Runs on the server only — the Key Secret never reaches the browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const CALL_FEE = Number(process.env.NEXT_PUBLIC_CALL_FEE) || 99;
const REGISTER_FEE = Number(process.env.NEXT_PUBLIC_REGISTER_FEE) || 29000;
const GST_RATE = 0.18; // must match the client (public/app.js)

// Per-course base fee (exclusive of GST). Mirrors COURSE_PRICES in public/app.js.
const COURSE_PRICES: Record<string, number> = {
  "practical-scrum-launchpad-weekday": 35000,
  "practical-scrum-launchpad-weekend": 40000,
  "practical-scrum-interview-mastery": 10000,
  "scrum-certification-program": 21000,
  "scrum-growth-mentorship": 50000,
  "scrum-smartpath": 15000,
};

// The amount is decided HERE — by the "kind" (and course slug) the client asks for,
// never trusted from the request body — so a user can't pay ₹1 for a ₹35,000 seat.
function amountFor(kind: string, slug: string): number {
  if (kind === "call") return CALL_FEE;
  if (kind === "register") {
    const base = COURSE_PRICES[slug] || REGISTER_FEE;
    return Math.round(base * (1 + GST_RATE)); // GST-inclusive total
  }
  return 0;
}

export async function POST(req: Request) {
  if (!KEY_ID || !KEY_SECRET) {
    return NextResponse.json({ error: "Payment gateway not configured." }, { status: 503 });
  }
  let body: { kind?: string; slug?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body → validated below */
  }
  const kind = String(body.kind || "");
  const rupees = amountFor(kind, String(body.slug || ""));
  if (!rupees) {
    return NextResponse.json({ error: "Unknown payment type." }, { status: 400 });
  }

  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const receipt = `${kind}_${body.slug ? body.slug.slice(0, 20) + "_" : ""}${Date.now()}`.slice(0, 40);

  const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: rupees * 100, // paise
      currency: "INR",
      receipt,
      notes: { kind, slug: body.slug || "" },
    }),
  });

  const data = await rzpRes.json().catch(() => null);
  if (!rzpRes.ok || !data?.id) {
    const msg = data?.error?.description || "Could not create the payment order.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json({
    orderId: data.id,
    amount: data.amount, // paise, as Razorpay recorded it
    currency: data.currency,
    keyId: KEY_ID,
  });
}
