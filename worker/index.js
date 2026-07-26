function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json", ...(init && init.headers) }
  });
}

async function checkPassword(request, env) {
  const auth = request.headers.get("authorization") || "";
  const provided = auth.replace(/^Bearer\s+/i, "");
  return provided.length > 0 && provided === env.EDIT_PASSWORD;
}

async function handleListSpecies(env) {
  const { results } = await env.DB.prepare(
    `SELECT s.dex_number, s.name, s.page, s.slot, c.collected_at
     FROM species s
     LEFT JOIN collection c ON c.dex_number = s.dex_number
     ORDER BY s.dex_number`
  ).all();
  return json({
    species: results.map((r) => ({
      dexNumber: r.dex_number,
      name: r.name,
      page: r.page,
      slot: r.slot,
      collected: !!r.collected_at,
      collectedAt: r.collected_at || null
    }))
  });
}

async function handleToggleCollect(request, env) {
  if (!(await checkPassword(request, env))) {
    return json({ error: "Incorrect password" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const dexNumber = Number(body.dexNumber);
  if (!Number.isInteger(dexNumber) || dexNumber < 1 || dexNumber > 1025) {
    return json({ error: "Invalid dexNumber" }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    "SELECT dex_number FROM collection WHERE dex_number = ?"
  ).bind(dexNumber).first();

  if (existing) {
    await env.DB.prepare("DELETE FROM collection WHERE dex_number = ?").bind(dexNumber).run();
    return json({ dexNumber, collected: false });
  }

  const collectedAt = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO collection (dex_number, collected_at) VALUES (?, ?)"
  ).bind(dexNumber, collectedAt).run();
  return json({ dexNumber, collected: true, collectedAt });
}

async function handleRandomHunt(env) {
  const row = await env.DB.prepare(
    `SELECT s.dex_number, s.name, s.page, s.slot
     FROM species s
     LEFT JOIN collection c ON c.dex_number = s.dex_number
     WHERE c.dex_number IS NULL
     ORDER BY RANDOM()
     LIMIT 1`
  ).first();

  if (!row) {
    return json({ done: true });
  }

  return json({
    done: false,
    dexNumber: row.dex_number,
    name: row.name,
    page: row.page,
    slot: row.slot
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/species" && request.method === "GET") {
      return handleListSpecies(env);
    }

    if (url.pathname === "/api/collect" && request.method === "POST") {
      return handleToggleCollect(request, env);
    }

    if (url.pathname === "/api/random-hunt" && request.method === "GET") {
      return handleRandomHunt(env);
    }

    return env.ASSETS.fetch(request);
  }
};
