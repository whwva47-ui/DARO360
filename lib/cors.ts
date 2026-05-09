/**
 * lib/cors.ts  (shared CORS utility — import into each route)
 * 
 * Single source of truth for allowed origins and CORS headers.
 * Prevents the 30-line duplication across every route file.
 */

export const PLATFORM_ORIGINS = [
  // Extension
  'chrome-extension://dkgpheiimhedhdfandcgeogmbfmmiobp',
  // CIC web apps
  'https://chattersinnercircle.vercel.app',
  'https://cic-app.pages.dev',
  // Platform pages (content scripts run here)
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
  // Dev
  'http://localhost:3000',
];

export const AUTH_ORIGINS = [
  'chrome-extension://dkgpheiimhedhdfandcgeogmbfmmiobp',
  'https://chattersinnercircle.vercel.app',
  'https://cic-app.pages.dev',
  'http://localhost:3000',
];

export function corsHeaders(origin: string | null, allowed: string[] = AUTH_ORIGINS, extraHeaders = '') {
  const o = origin && allowed.includes(origin) ? origin : allowed[1];
  return {
    'Access-Control-Allow-Origin':  o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': `Content-Type, X-User-Email, X-Session-Token, X-API-Key${extraHeaders ? ', ' + extraHeaders : ''}`,
    'Access-Control-Allow-Credentials': 'false',
  };
}
