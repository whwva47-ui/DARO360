/**
 * app/api/pro/request/route.ts
 *
 * Receives upgrade or multi-device requests from the extension.
 * Logs to pro_requests table. Emails admin. Never exposes payment details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY!);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'whwva47@gmail.com';

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
  'https://agents.moderationinterface.com',
  'http://localhost:3000',
];

function cors(origin: string | null) {
  const o = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
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
    const body  = await req.json();
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

  // Log to pro_requests
  await supabase.from('pro_requests').insert({
    email,
    payment_method: paymentMethod || null,
    request_type:   requestType,
    status:         'pending',
  });

  // Email admin
  const isMultiDevice = requestType === 'multi_device';
  const subject = isMultiDevice
    ? `🖥 Multi-device request — ${email}`
    : `⬆ Upgrade request — ${methodLabels[paymentMethod] ?? paymentMethod} — ${email}`;

  try {
    await resend.emails.send({
      from:    'CIC System <noreply@chattersinnercircle.com>',
      to:      ADMIN_EMAIL,
      subject,
      html: isMultiDevice
        ? `<p><b>${email}</b> is requesting multi-device access.</p>
           <p>To approve: run this in Supabase SQL Editor:</p>
           <pre>UPDATE public.operators SET allow_multiple_devices = TRUE WHERE email = '${email}';
UPDATE public.active_sessions SET allow_multiple = TRUE WHERE email = '${email}';</pre>`
        : `<p><b>${email}</b> wants to upgrade via <b>${methodLabels[paymentMethod] ?? paymentMethod}</b>.</p>
           <p>Reply to <b>${email}</b> with your payment details for ${methodLabels[paymentMethod] ?? paymentMethod}.</p>
           <p>After payment confirmed, activate Pro:</p>
           <pre>UPDATE public.profiles SET plan = 'pro', plan_status = 'approved' WHERE email = '${email}';</pre>`,
    });
  } catch (e) {
    console.error('[pro/request] email failed:', e);
  }

  return NextResponse.json(
    { success: true, message: isMultiDevice
        ? 'Request sent. The admin will review and email you.'
        : `Got it! We will email you the ${methodLabels[paymentMethod] ?? 'payment'} details shortly.`
    },
    { status: 200, headers: h }
  );
}
