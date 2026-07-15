# Nehemiah Marketing — Website + Lead Intake

A Node/Express app that serves the landing page and writes every lead
(from the form or the AI chat assistant) into Supabase.

## Stack
- **Supabase** — database (already live: `nehemiah-marketing-crm`, project ref `efugqbytugtssewcivpf`)
- **GitHub** — code hosting
- **Railway** — runs the app
- **Cloudflare** — DNS for `nehemiahmarketing.com`

---

## 1. GitHub

This repo is already live at github.com/bigtycoonlabs/nehemiah-marketing-site.

## 2. Deploy on Railway

1. railway.app → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. Railway auto-detects Node from `package.json` and runs `npm start`.
3. Go to the service's **Variables** tab and add:
   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | `https://efugqbytugtssewcivpf.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase dashboard → Project Settings → API → `service_role` key (**secret** — only ever goes here, never in the code or the browser) |
4. Once it deploys, Railway gives you a `*.up.railway.app` URL — confirm `/api/health` returns `{"ok":true,"db_connected":true}`.
5. In the service → **Settings → Networking → Custom Domain**, add `nehemiahmarketing.com` (and `www.nehemiahmarketing.com`). Railway will show you a CNAME target like `xxxx.up.railway.app`.

## 3. Point the domain at Railway (Cloudflare)

In the Cloudflare dashboard for `nehemiahmarketing.com` → **DNS**:

| Type | Name | Target | Proxy status |
|---|---|---|---|
| CNAME | `@` (root) | the target Railway gave you | DNS only (grey cloud) initially |
| CNAME | `www` | the target Railway gave you | DNS only (grey cloud) initially |

Root-domain CNAMEs work fine on Cloudflare (it flattens them automatically).
Once Railway shows the domain as verified/issued (SSL cert active), you can
switch the proxy to "Proxied" (orange cloud) if you want Cloudflare's CDN/WAF
in front of it.

## 4. AI Assistant + Supabase

Once your agent is live at agent.aiassistant.co, drop the `agent_id` into
`public/index.html` in the two spots marked `YOUR_AGENT_ID`. If aiassistant.co
supports outbound webhooks on new conversations, point that webhook at:

```
POST https://nehemiahmarketing.com/api/leads
Content-Type: application/json

{
  "name": "...",
  "phone": "...",
  "email": "...",
  "business": "...",
  "message": "...",
  "source": "ai_chat"
}
```

That's the same endpoint the form uses, so every channel lands in one place.

## Local development

```bash
npm install
cp .env.example .env   # then fill in the service_role key
npm start              # http://localhost:3000
```
