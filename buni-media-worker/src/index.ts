type Env = {
  BUCKET: R2Bucket;
};

const CACHE_MAX_AGE = 60 * 60 * 24 * 365;

const ALLOWED_CONTENT_TYPES = new Set([
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/ogg",
  "audio/webm",
  "application/octet-stream",
]);

function buildCacheKey(request: Request): Request {
  const url = new URL(request.url);
  return new Request(url.toString(), { method: "GET" });
}

function buildSuccessResponse(object: R2ObjectBody): Response {
  const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, immutable`,
      "ETag": object.httpEtag,
      "Last-Modified": object.uploaded.toUTCString(),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "X-Cache": "MISS",
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { method } = request;

    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (method !== "GET" && method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    if (!key) {
      return new Response("Not found", { status: 404 });
    }

    const cacheKey = buildCacheKey(request);
    const cache = caches.default;

    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set("X-Cache", "HIT");
      return response;
    }

    const object = await env.BUCKET.get(key);

    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return new Response("Forbidden", { status: 403 });
    }

    const response = buildSuccessResponse(object);

    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
} satisfies ExportedHandler<Env>;
