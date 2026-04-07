type Env = {
  BUCKET: R2Bucket
}

function buildHeaders(object: R2Object | R2ObjectBody): Headers {
  return new Headers({
    "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "ETag": object.httpEtag,
    "Last-Modified": object.uploaded.toUTCString(),
    "Accept-Ranges": "bytes",
    "Access-Control-Allow-Origin": "*",
  })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { method, url } = request

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Max-Age": "86400",
        },
      })
    }

    if (method !== "GET" && method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 })
    }

    const cache = caches.default
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const key = new URL(url).pathname.slice(1)
    if (!key) return new Response("Not found", { status: 404 })

    if (method === "HEAD") {
      const meta = await env.BUCKET.head(key)
      if (!meta) return new Response("Not found", { status: 404 })
      
      const response = new Response(null, {
        headers: {
          ...Object.fromEntries(buildHeaders(meta)),
          "Content-Length": meta.size.toString(),
        },
      })
      ctx.waitUntil(cache.put(request, response.clone()))
      return response
    }

    const object = await env.BUCKET.get(key, { range: request.headers })

    if (!object || !("body" in object)) {
      return new Response("Not found", { status: 404 })
    }

    const headers = buildHeaders(object)
    let status = 200

    if (object.range) {
      status = 206
      const { offset, length } = object.range as { offset: number; length: number }
      headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`)
      headers.set("Content-Length", length.toString())
    } else {
      headers.set("Content-Length", object.size.toString())
    }

    const response = new Response(object.body, { status, headers })
    ctx.waitUntil(cache.put(request, response.clone()))
    return response
  },
} satisfies ExportedHandler<Env>
