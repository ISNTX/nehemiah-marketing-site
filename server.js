// Nehemiah Marketing — site + lead intake API
// Serves the landing page and accepts leads from the form + AI assistant,
// writing them straight into the Supabase `leads` table.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Supabase (server-side only — service_role key never reaches the browser) ----
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[warn] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — /api/leads will fail until configured.');
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Basic abuse protection on the public intake endpoint
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const VALID_SOURCES = ['website_form', 'ai_chat', 'sms', 'email', 'phone', 'referral', 'other'];

app.post('/api/leads', leadLimiter, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Server is not connected to the database yet.' });
  }

  const { name, business, phone, email, industry, message, source } = req.body || {};

  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Name, phone, and email are required.' });
  }

  const row = {
    name: String(name).slice(0, 200),
    business_name: business ? String(business).slice(0, 200) : null,
    phone: String(phone).slice(0, 40),
    email: String(email).slice(0, 200),
    industry: industry ? String(industry).slice(0, 100) : null,
    message: message ? String(message).slice(0, 4000) : null,
    source: VALID_SOURCES.includes(source) ? source : 'website_form',
  };

  const { data, error } = await supabase.from('leads').insert(row).select().single();

  if (error) {
    console.error('[supabase insert error]', error);
    return res.status(500).json({ error: 'Could not save your info. Please call us instead.' });
  }

  // Log it as the first interaction on this lead
  await supabase.from('interactions').insert({
    lead_id: data.id,
    channel: row.source === 'ai_chat' ? 'chat' : 'form',
    direction: 'inbound',
    summary: row.message || 'New inquiry submitted.',
  });

  res.status(201).json({ ok: true, id: data.id });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db_connected: !!supabase });
});

app.listen(PORT, () => {
  console.log(`Nehemiah Marketing site running on port ${PORT}`);
});
