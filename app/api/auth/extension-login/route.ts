/**
 * app/api/auth/extension-login/route.ts
 * 
 * Issues a 5-minute one-time token after validating the operator
 * exists in the PROFILES table (the real live CIC user table).
 * Token is used by the popup to open cic-app.pages.dev/?token=TOKEN
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing Supabase environment variables");
    throw new Error("Supabase environment variables not set");
  }

  return createClient(url, key);
}

const ALLOWED_ORIGINS = [
  "chrome-extension://dkgpheiimhedhdfandcgeogmbfmmiobp",
  "[cic-app.pages.dev](https://cic-app.pages.dev)",
  "[localhost](http://localhost:3000)",
];

function cors(origin: string | null) {
  const o =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { headers: cors(origin) });
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const headers = cors(origin);

    const supabase = getSupabase();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400, headers }
      );
    }

    // Confirm profile exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Unauthorized user" },
        { status: 403, headers }
      );
    }

    // Generate 5-minute token
    const token = crypto.randomBytes(32).toString("hex");

    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await supabase.from("extension_tokens").insert({
      token,
      email,
      expires_at: expires,
    });

    return NextResponse.json(
      { token, expires_at: expires },
      { status: 200, headers }
    );
  } catch (err: any) {
    console.error("Extension login error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
