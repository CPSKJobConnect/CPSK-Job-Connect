// Lightweight API fetch wrapper that adds non-safelisted header for same-origin
// state-changing requests to satisfy CSRF guard (x-app-request: 1).
export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  try {
    // Normalize URL string for detection
    const url = typeof input === 'string' ? input : (input as Request).url;

    // Only add header for same-origin API routes (starting with /api)
    const isSameOriginApi = typeof url === 'string' && (url.startsWith('/api') || url.includes(window.location.origin + '/api'));

    const headers = new Headers(init.headers || {});
    if (isSameOriginApi) {
      // Don't overwrite existing header if present
      if (!headers.has('x-app-request')) headers.set('x-app-request', '1');
    }

    // Ensure content-type for JSON bodies when not already set.
    // Do NOT set content-type for FormData / URLSearchParams / Blob (browser sets boundary)
    const body = init.body;
    const isFormBody = (typeof FormData !== 'undefined') && body instanceof FormData;
    const isUrlSearch = (typeof URLSearchParams !== 'undefined') && body instanceof URLSearchParams;
    const isBlob = (typeof Blob !== 'undefined') && body instanceof Blob;

    if (body && !headers.has('content-type') && !isFormBody && !isUrlSearch && !isBlob && typeof body !== 'string') {
      headers.set('content-type', 'application/json');
    }

    const mergedInit: RequestInit = { ...init, headers };
    return fetch(input, mergedInit);
  } catch (err) {
    // Re-throw for callers to handle
    throw err;
  }
}

export default apiFetch;
