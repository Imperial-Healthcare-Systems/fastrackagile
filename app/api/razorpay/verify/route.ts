import { NextResponse } from "next/server";
import crypto from "node:crypto";

// Server-only: verifies the payment signature Razorpay returns to the browser.
// The browser cannot forge this because it never has the Key Secret.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Best-effort: pull the authoritative payment details from Razorpay and write a
// receipt row via the service_role key (bypasses RLS). Never blocks the unlock —
// if logging fails or isn't configured, the payment still succeeds.
async function logPayment(
  orderId: string,
  paymentId: string,
  meta: { kind?: string; slug?: string; userId?: string },
) {
  if (!SUPA_URL || !SERVICE_KEY) return; // logging not configured yet
  try {
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
    const pr = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    const p = await pr.json().catch(() => ({} as Record<string, unknown>));

    const row = {
      order_id: orderId,
      payment_id: paymentId,
      kind: meta.kind || null,
      slug: meta.slug || null,
      amount: typeof p.amount === "number" ? p.amount : null,
      currency: p.currency || "INR",
      status: p.status || null,
      method: p.method || null,
      email: p.email || null,
      contact: p.contact || null,
      user_id: meta.userId || null,
    };

    await fetch(`${SUPA_URL}/rest/v1/payments`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal", // idempotent on payment_id
      },
      body: JSON.stringify(row),
    });
  } catch {
    /* logging is best-effort — swallow errors so the payment still unlocks */
  }
}

export async function POST(req: Request) {
  if (!KEY_SECRET) {
    return NextResponse.json({ valid: false, error: "Not configured." }, { status: 503 });
  }
  let b: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    kind?: string;
    slug?: string;
    userId?: string;
  } = {};
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Bad request." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = b;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ valid: false, error: "Missing payment fields." }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(expected);
  const c = Buffer.from(razorpay_signature);
  const valid = a.length === c.length && crypto.timingSafeEqual(a, c);

  if (!valid) {
    return NextResponse.json({ valid: false, error: "Signature mismatch." }, { status: 400 });
  }

  await logPayment(razorpay_order_id, razorpay_payment_id, {
    kind: b.kind,
    slug: b.slug,
    userId: b.userId,
  });

  return NextResponse.json({ valid: true, paymentId: razorpay_payment_id });
}
