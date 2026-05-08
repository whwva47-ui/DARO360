/**
 * app/api/pro/request/route.ts
 *
 * Receives upgrade and multi-device requests from the extension.
 *
 * NO EMAIL SDK — Resend removed completely.
 *
 * What it does:
 * 1. Validates the request
 * 2. Logs it to the pro_requests table in Supabase
 * 3. Optionally pings a webhook URL (set ADMIN_WEBHOOK_URL in Vercel env)
 *    — works with Make.com, Zapier, n8n, or any webhook that forwards to your email/WhatsApp
 * 4. Returns success to the operator immediately
 *
 * Admin sees new requests by:
 *   a) Checking Supabase → pro_requests table (Dashboard → Table Editor)
 *   b) OR setting ADMIN_WEBHOOK_URL to a Make/Zapier webhook that sends you a WhatsApp/email
 *
 * SQL to check pending requests anytime:
 *   SELECT email, payment_method, request_type, status, created_at
 *   FROM pro_requests WHERE status = 'pending' ORDER BY created_at DESC;
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars.');
  return createClient(url, key);
}

const ADMIN_EMAIL   = process.env.ADMIN_EMAIL   || 'whwva47@gmail.com';
const WEBHOOK_URL   = process.env.ADMIN_WEBHOOK_URL || ''; // optional

const ALLOWED_ORIGINS = [
  'chrome-extension://dkgpheiimhedhdfandcgeogmbfmmiobp',
  'https://cic-app.pages.dev',
  'https://chattersinnercircle.vercel.app',
  'https://chathomebase.com',
  'https://www.chathomebase.com',
  'https://alpha.date',
  'https://www.alpha.date',
  'https://onlyfans.com',
  'https://fansly.com',
  'https://loyalfans.com',
  'https://fancentro.com',
  'https://admireme.vip',
  'https://fanvue.com',
  'https://www.manyvids.com',
  'https://unlockd.com',
  'http://localhost:3000',
];

function cors(origin: string | null) {
  const o = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req.headers.get('origin')) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const h = cors(origin);

  let email: string, paymentMethod: string, requestType: string;
  try {
    const body   = await req.json();
    email         = (body.email         ?? req.headers.get('X-User-Email') ?? '').trim().toLowerCase();
    paymentMethod = (body.paymentMethod ?? '').trim().toLowerCase();
    requestType   = (body.requestType   ?? 'upgrade').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: h });
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400, headers: h });
  }

  const methodLabels: Record<string, string> = {
    mpesa:  'M-Pesa',
    card:   'Card (Visa / Mastercard)',
    paypal: 'PayPal',
    crypto: 'Crypto (USDT / BTC / ETH)',
  };

  // ── 1. Log to Supabase ─────────────────────────────────────────────
  try {
    const supabase = getSupabase();
    await supabase.from('pro_requests').insert({
      email,
      payment_method: paymentMethod || null,
      request_type:   requestType,
      status:         'pending',
    });
  } catch (dbErr) {
    console.error('[pro/request] Supabase insert error:', dbErr);
    // Don't fail the request — still return success to the operator
  }

  // ── 2. Ping webhook if configured (Make.com / Zapier / n8n) ────────
  // Set ADMIN_WEBHOOK_URL in Vercel env to receive instant notifications
  // via WhatsApp, Gmail, Telegram, or any channel your webhook supports
  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:          requestType,
          email,
          paymentMethod: methodLabels[paymentMethod] ?? paymentMethod,
          adminEmail:    ADMIN_EMAIL,
          timestamp:     new Date().toISOString(),
          message: requestType === 'multi_device'
            ? `CIC: ${email} is requesting multi-device access.`
            : `CIC: ${email} wants to upgrade via ${methodLabels[paymentMethod] ?? paymentMethod}. Reply with payment details.`,
        }),
      });
    } catch (whErr) {
      console.warn('[pro/request] Webhook ping failed:', whErr);
      // Non-fatal — request is already logged in Supabase
    }
  }

  // ── 3. Return success to operator ──────────────────────────────────
  const isMultiDevice = requestType === 'multi_device';
  return NextResponse.json(
    {
      success: true,
      message: isMultiDevice
        ? 'Request sent. The admin will review and contact you shortly.'
        : `Got it! The admin will send you the ${methodLabels[paymentMethod] ?? 'payment'} details shortly.`,
    },
    { status: 200, headers: h }
  );
}
