/**
 * PrayVail R2 Upload Worker
 *
 * Endpoints (all require a valid Firebase ID token in Authorization: Bearer <token>):
 *   PUT  /upload?key=<object-key>&contentType=<mime>  — upload a file to R2
 *   DELETE /delete?key=<object-key>                   — delete a file from R2
 *
 * Public reads go directly to https://media.prayvail.org/<key> — the worker
 * is only used for admin writes, so every request here must be authenticated.
 */

const FIREBASE_PROJECT_ID = 'prayvail-14bb0';
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const PUBLIC_BASE_URL = 'https://media.prayvail.org';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

// ── JWT verification ──────────────────────────────────────────────────────────

function base64UrlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function getJwks(ctx) {
  // Cache the JWKS response using Cloudflare's Cache API
  const cache = caches.default;
  const cacheKey = new Request(JWKS_URL);
  let cached = await cache.match(cacheKey);
  if (!cached) {
    const fresh = await fetch(JWKS_URL);
    // Cache for 6 hours (Google rotates keys ~daily)
    const headers = new Headers(fresh.headers);
    headers.set('Cache-Control', 'public, max-age=21600');
    cached = new Response(await fresh.arrayBuffer(), { status: fresh.status, headers });
    ctx.waitUntil(cache.put(cacheKey, cached.clone()));
  }
  return cached.json();
}

async function verifyFirebaseToken(token, ctx) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header, payload;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;
  if (payload.iat > now + 60) return null; // clock skew guard
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
  if (payload.aud !== FIREBASE_PROJECT_ID) return null;
  if (!payload.sub) return null;

  let jwks;
  try {
    jwks = await getJwks(ctx);
  } catch {
    return null;
  }

  const jwk = jwks.keys?.find((k) => k.kid === header.kid);
  if (!jwk) return null;

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const message = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlDecode(parts[2]);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, message);
    return valid ? payload : null;
  } catch {
    return null;
  }
}

// ── Request handler ───────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Auth check
    const authHeader = request.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const claims = await verifyFirebaseToken(token, ctx);
    if (!claims) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // PUT /upload — stream body directly to R2
    if (request.method === 'PUT' && url.pathname === '/upload') {
      const key = url.searchParams.get('key');
      const contentType = url.searchParams.get('contentType') || 'application/octet-stream';

      if (!key) {
        return new Response(JSON.stringify({ error: 'Missing key' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const body = await request.arrayBuffer();
      await env.R2.put(key, body, {
        httpMetadata: { contentType },
      });

      return new Response(JSON.stringify({ url: `${PUBLIC_BASE_URL}/${key}` }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /delete — remove object from R2
    if (request.method === 'DELETE' && url.pathname === '/delete') {
      const key = url.searchParams.get('key');
      if (!key) {
        return new Response(JSON.stringify({ error: 'Missing key' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      await env.R2.delete(key);

      return new Response(JSON.stringify({ deleted: key }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  },
};
