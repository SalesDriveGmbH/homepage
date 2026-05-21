/**
 * SalesDrive · Vercel Serverless Function
 * POST /api/lead
 *
 * Receives funnel form payload and creates a Lead in Close CRM.
 *
 * Required env vars (set in Vercel project → Settings → Environment Variables):
 *   CLOSE_API_KEY  — Close CRM API key (format: api_xxxxxxxxxxxx)
 *
 * Optional env vars:
 *   CLOSE_LEAD_STATUS_ID    — id of the lead status to assign (e.g. stat_xxx). If omitted, Close picks default.
 *   CLOSE_LEAD_SOURCE_FIELD — custom-field id for "Source/Quelle" (lcf_xxx). Optional.
 *   NOTIFY_WEBHOOK          — Slack / Discord / Make webhook URL to also notify on each lead. Optional.
 */

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  // CORS for same-origin (safety: only POST)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  // Required fields
  const required = ['vorname', 'nachname', 'email', 'telefon', 'firma'];
  for (const f of required) {
    if (!body[f] || String(body[f]).trim().length === 0) {
      return res.status(400).json({ error: `Missing field: ${f}` });
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) {
    console.error('[lead] CLOSE_API_KEY not set');
    // Still return 200 so the user flow continues; we just log it for follow-up.
    return res.status(200).json({ ok: false, queued: false, reason: 'no_api_key' });
  }

  const fullName = `${body.vorname} ${body.nachname}`.trim();
  const description = [
    body.position ? `Position: ${body.position}` : null,
    body.umsatz ? `Jahresumsatz: ${body.umsatz}` : null,
    body.kundenwert ? `Kundenwert: ${body.kundenwert}` : null,
    body.branche ? `Branche: ${body.branche}` : null,
    body.quelle ? `Quelle: ${body.quelle}` : null,
    body.website ? `Website: ${body.website}` : null,
    body.anliegen ? `\nAnliegen:\n${body.anliegen}` : null,
    body.page ? `\nLanding: ${body.page}` : null,
  ].filter(Boolean).join('\n');

  const leadPayload = {
    name: body.firma,
    url: body.website || null,
    description,
    contacts: [
      {
        name: fullName,
        title: body.position || null,
        emails: [{ email: body.email, type: 'office' }],
        phones: [{ phone: body.telefon, type: 'office' }],
      },
    ],
    custom: {
      Quelle: body.quelle || 'website-funnel',
      Branche: body.branche || null,
      Umsatz: body.umsatz || null,
      Kundenwert: body.kundenwert || null,
    },
  };

  if (process.env.CLOSE_LEAD_STATUS_ID) {
    leadPayload.status_id = process.env.CLOSE_LEAD_STATUS_ID;
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(apiKey + ':').toString('base64');
    const closeRes = await fetch('https://api.close.com/api/v1/lead/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(leadPayload),
    });

    const closeBody = await closeRes.json().catch(() => ({}));

    if (!closeRes.ok) {
      console.error('[lead] Close API error', closeRes.status, closeBody);
      // Still respond 200 so we don't block the user — log for ops.
      return res.status(200).json({ ok: false, status: closeRes.status, error: closeBody });
    }

    // Optional: ping additional webhook (Slack, Make, n8n, …)
    const hook = process.env.NOTIFY_WEBHOOK;
    if (hook) {
      try {
        await fetch(hook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🔥 Neuer Lead: *${fullName}* — ${body.firma} (${body.email})`,
            lead: leadPayload,
          }),
        });
      } catch (e) { /* swallow */ }
    }

    return res.status(200).json({ ok: true, lead_id: closeBody.id });
  } catch (err) {
    console.error('[lead] Exception:', err);
    return res.status(200).json({ ok: false, error: 'exception' });
  }
}
