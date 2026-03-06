export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "tdh-comments-api",
      status: "ready"
    }),
    {
      headers: {
        "content-type": "application/json; charset=UTF-8"
      }
    }
  );
}
