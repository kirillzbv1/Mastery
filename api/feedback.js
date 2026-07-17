module.exports = async function handler(req, res) {
try {
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { res.status(500).json({ error: 'Missing Supabase configuration' }); return; }
if (req.method === 'GET') {
const r = await fetch(url + '/rest/v1/feedback?select=id,created_at,type,message,status&order=created_at.desc&limit=200', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
const items = await r.json();
res.status(200).json({ items: items });
return;
}
if (req.method === 'POST') {
const body = req.body || {};
const type = (body.type === 'idea') ? 'idea' : 'bug';
const message = (body.message || '').toString().trim();
if (!message) { res.status(400).json({ error: 'message is required' }); return; }
const r = await fetch(url + '/rest/v1/feedback', { method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify([{ type: type, message: message }]) });
if (!r.ok) { const t = await r.text(); res.status(502).json({ error: 'Supabase error', detail: t }); return; }
res.status(200).json({ ok: true });
return;
}
res.status(405).json({ error: 'Method not allowed' });
} catch (e) {
res.status(500).json({ error: String(e && e.message ? e.message : e) });
}
};
