export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "content-type": "application/json; charset=UTF-8"
      }
    });
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function containsLink(text) {
    return /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|io|ru|xyz|me|gg|ly|co)\b)/i.test(text);
  }

  function containsBadWords(text) {
    const banned = [
      "fuck", "shit", "bitch", "asshole", "bastard", "motherfucker",
      "сука", "блять", "блядь", "хуй", "пизда", "ебать", "ебан"
    ];

    const t = text.toLowerCase();
    return banned.some(word => t.includes(word));
  }

  function isSpamPattern(text) {
    const t = text.toLowerCase();

    if (/(.)\1{7,}/.test(t)) return true; // aaaaaaaa
    if (/^[^a-zа-я0-9]+$/i.test(t)) return true; // only symbols
    if (t.length < 3) return true;

    const spamPhrases = [
      "nice project",
      "good project",
      "great project",
      "awesome project",
      "gm",
      "wow",
      "test",
      "hello admin"
    ];

    return spamPhrases.includes(t);
  }

  async function recentIpCommentCount(ip, msWindow) {
    const since = Date.now() - msWindow;
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM comments WHERE ip = ? AND created_at >= ?"
    ).bind(ip, since).first();

    return Number(row?.cnt || 0);
  }

  async function hasDuplicateRecentComment(ip, articleSlug, author, comment, msWindow) {
    const since = Date.now() - msWindow;
    const row = await env.DB.prepare(
      `SELECT id
       FROM comments
       WHERE ip = ?
         AND article_slug = ?
         AND author = ?
         AND comment = ?
         AND created_at >= ?
       LIMIT 1`
    ).bind(ip, articleSlug, author, comment, since).first();

    return !!row;
  }

  if (request.method === "GET") {
    const slug = normalizeText(url.searchParams.get("slug"));

    if (!slug) {
      return json({ error: "missing slug" }, 400);
    }

    const result = await env.DB.prepare(
      `SELECT author, comment, created_at
       FROM comments
       WHERE article_slug = ?
         AND status = 'approved'
       ORDER BY id DESC
       LIMIT 50`
    ).bind(slug).all();

    return json(result.results || []);
  }

  if (request.method === "POST") {
    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid json" }, 400);
    }

    const slug = normalizeText(body?.slug);
    const author = normalizeText(body?.author);
    const comment = normalizeText(body?.comment);

    if (!slug || !author || !comment) {
      return json({ error: "missing fields" }, 400);
    }

    if (author.length < 2 || author.length > 40) {
      return json({ error: "invalid author length" }, 400);
    }

    if (comment.length < 3 || comment.length > 500) {
      return json({ error: "invalid comment length" }, 400);
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    // Hard block: 1 comment per 30 seconds from one IP
    const last30sCount = await recentIpCommentCount(ip, 30 * 1000);
    if (last30sCount >= 1) {
      return json({ error: "rate limit", message: "Please wait 30 seconds before posting again." }, 429);
    }

    // Hard block: duplicate repeated comment in 24h
    const duplicate = await hasDuplicateRecentComment(ip, slug, author, comment, 24 * 60 * 60 * 1000);
    if (duplicate) {
      return json({ error: "duplicate comment" }, 400);
    }

    // Auto moderation rules
    let status = "approved";
    let moderationReason = null;

    if (containsLink(comment)) {
      status = "rejected";
      moderationReason = "links_not_allowed";
    } else if (containsBadWords(comment)) {
      status = "rejected";
      moderationReason = "bad_language";
    } else if (isSpamPattern(comment)) {
      status = "pending";
      moderationReason = "spam_pattern";
    } else {
      // Soft anti-spam: too many comments from same IP in 10 minutes -> pending
      const last10mCount = await recentIpCommentCount(ip, 10 * 60 * 1000);
      if (last10mCount >= 3) {
        status = "pending";
        moderationReason = "too_many_comments";
      }
    }

    await env.DB.prepare(
      `INSERT INTO comments
       (article_slug, author, comment, created_at, ip, status, moderation_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      slug,
      author,
      comment,
      Date.now(),
      ip,
      status,
      moderationReason
    ).run();

    if (status === "approved") {
      return json({ success: true, status: "approved" });
    }

    if (status === "pending") {
      return json({
        success: true,
        status: "pending",
        message: "Your comment was sent for moderation."
      });
    }

    return json({
      success: false,
      status: "rejected",
      message: "Your comment was rejected by moderation rules."
    }, 400);
  }

  return new Response("Method not allowed", { status: 405 });
}
