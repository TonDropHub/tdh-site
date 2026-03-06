export async function onRequest(context) {

const { request, env } = context

if (request.method === "GET") {

const url = new URL(request.url)
const slug = url.searchParams.get("slug")

if (!slug) {
return new Response(JSON.stringify({error:"missing slug"}), {status:400})
}

const result = await env.DB.prepare(
"SELECT author, comment, created_at FROM comments WHERE article_slug=? ORDER BY id DESC LIMIT 50"
).bind(slug).all()

return new Response(JSON.stringify(result.results), {
headers: { "content-type": "application/json" }
})

}

if (request.method === "POST") {

const body = await request.json()

const { slug, author, comment } = body

if (!slug || !author || !comment) {
return new Response(JSON.stringify({error:"missing fields"}), {status:400})
}

if (comment.length > 500) {
return new Response(JSON.stringify({error:"comment too long"}), {status:400})
}

if (comment.includes("http")) {
return new Response(JSON.stringify({error:"links not allowed"}), {status:400})
}

const ip = request.headers.get("CF-Connecting-IP") || "unknown"

await env.DB.prepare(
"INSERT INTO comments (article_slug, author, comment, created_at, ip) VALUES (?, ?, ?, ?, ?)"
).bind(
slug,
author,
comment,
Date.now(),
ip
).run()

return new Response(JSON.stringify({success:true}), {
headers: { "content-type": "application/json" }
})

}

return new Response("Method not allowed", {status:405})

}
