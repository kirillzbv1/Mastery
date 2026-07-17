module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }
  const id = (req.query.id || '').toString().trim();
  if (!id || id.length < 4) {
    res.status(400).json({ error: 'Missing or invalid id' });
    return;
  }
  const headers = {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: 'Bearer ' + SUPABASE_SECRET_KEY,
    'Content-Type': 'application/json',
  };
  try {
    if (req.method === 'GET') {
      const url = SUPABASE_URL + '/rest/v1/mastery_sync?id=eq.' + encodeURIComponent(id) + '&select=id,updated_at,data&limit=1';
      const r = await fetch(url, { headers });
      if (!r.ok) {
        const detail = await r.text();
        res.status(502).json({ error: 'Upstream error', detail });
        return;
      }
      const rows = await r.json();
      if (!rows.length) {
        res.status(200).json({ data: null });
        return;
      }
      const row = rows[0];
      res.status(200).json({ data: { updatedAt: Number(row.updated_at), data: row.data } });
      return;
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      body = body || {};
      const updatedAt = Number(body.updatedAt) || Date.now();
      const data = body.data || {};
      const url = SUPABASE_URL + '/rest/v1/mastery_sync?on_conflict=id';
      const r = await fetch(url, {
        method: 'POST',
        headers: Object.assign({}, headers, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify([{ id, updated_at: updatedAt, data }]),
      });
      if (!r.ok) {
        const detail = await r.text();
        res.status(502).json({ error: 'Upstream error', detail });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: 'Unexpected error', detail: String(e) });
  }
};
