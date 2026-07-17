export const CONTENT_SECURITY_POLICY_HEADER = "content-security-policy";
export const REQUEST_NONCE_HEADER = "x-nonce";

const STATIC_SECURITY_HEADERS = {
  "permissions-policy":
    "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY"
} as const;

const VALID_NONCE = /^[A-Za-z0-9_-]{16,}$/;

export function createCspNonce(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function buildContentSecurityPolicy(
  nonce: string,
  { allowUnsafeEval = false }: { allowUnsafeEval?: boolean } = {}
): string {
  if (!VALID_NONCE.test(nonce)) {
    throw new Error("CSP nonce must be a base64url-safe random value.");
  }

  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(allowUnsafeEval ? ["'unsafe-eval'"] : [])
  ];
  const connectSources = [
    "'self'",
    ...(allowUnsafeEval ? ["ws:", "wss:"] : [])
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'"
  ].join("; ");
}

export function applySecurityResponseHeaders(
  headers: Headers,
  contentSecurityPolicy: string
): void {
  headers.set(CONTENT_SECURITY_POLICY_HEADER, contentSecurityPolicy);

  for (const [name, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
    headers.set(name, value);
  }
}

export function isSameOrigin(
  requestUrl: URL,
  originHeader: string | null
): boolean {
  if (!originHeader || originHeader === "null") {
    return false;
  }

  try {
    return new URL(originHeader).origin === requestUrl.origin;
  } catch {
    return false;
  }
}
