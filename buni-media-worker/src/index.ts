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
  "audio/mp4",
  "application/octet-stream",
]);

function buildCacheKey(request: Request): Request {
  const url = new URL(request.url);
  return new Request(url.toString(), { method: "GET" });
}

function buildResponseHeaders(object: R2ObjectBody | R2Object, isRange: boolean): Headers {
  const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, immutable`,
    "ETag": object.httpEtag,
    "Last-Modified": object.uploaded.toUTCString(),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Accept-Ranges": "bytes",
  });

  if (isRange && "range" in object && object.range) {
    const r = object.range as any;
    if (r.offset !== undefined && r.length !== undefined) {
      headers.set("Content-Range", `bytes ${r.offset}-${r.offset + r.length - 1}/${object.size}`);
      headers.set("Content-Length", r.length.toString());
    } else if (r.suffix !== undefined) {
      headers.set("Content-Range", `bytes ${object.size - r.suffix}-${object.size - 1}/${object.size}`);
      headers.set("Content-Length", r.suffix.toString());
    }
  } else {
    headers.set("Content-Length", object.size.toString());
  }

  return headers;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { method, headers } = request;

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

    const isRangeRequested = headers.has("Range");


    if (!isRangeRequested) {
      const cacheKey = buildCacheKey(request);
      const cache = caches.default;
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        const response = new Response(cachedResponse.body, cachedResponse);
        response.headers.set("X-Cache", "HIT");
        return response;
      }
    }

    const object = await env.BUCKET.get(key, { range: request.headers });

    if (!object || !('body' in object)) {
      return new Response("Not found", { status: 404 });
    }

    const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";
    const baseContentType = contentType.split(";")[0].trim();

    if (!ALLOWED_CONTENT_TYPES.has(baseContentType)) {
      return new Response("Forbidden", { status: 403 });
    }

    const isPartialContent = isRangeRequested && ('range' in object) && !!object.range;
    const responseHeaders = buildResponseHeaders(object, isPartialContent);
    responseHeaders.set("X-Cache", "MISS");

    const response = new Response((object as R2ObjectBody).body, {
      status: isPartialContent ? 206 : 200,
      headers: responseHeaders,
    });

    if (!isRangeRequested) {
      const cacheKey = buildCacheKey(request);
      ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
    }

    return response;
  },
} satisfies ExportedHandler<Env>;
