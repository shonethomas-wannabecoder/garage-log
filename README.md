# Garage Log

Phone-first PWA to log car repair invoices and pull up your last service at the shop.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (auth, Postgres, storage, edge functions)
- Anthropic Claude (invoice parsing via edge function)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Supabase project**

   - Create a project at [supabase.com](https://supabase.com)
   - In the SQL editor, run `supabase/migrations/001_initial_schema.sql`
   - Under Authentication → **URL Configuration**, set Site URL to `http://localhost:5173` and add these **Redirect URLs**:
     - `http://localhost:5173/**`
     - `http://localhost:5174/**` (Vite may use 5174 if 5173 is busy)
   - Copy Project URL and anon key from Settings → API

3. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

4. **Deploy invoice parsing (for Scan bill)**

   Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
   supabase functions deploy parse-invoice
   ```

   `YOUR_PROJECT_REF` is the ID in your dashboard URL (`https://supabase.com/dashboard/project/XXXX`).

   Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com).

5. **Run**

   ```bash
   npm run dev
   ```

   Open the URL on your phone and use “Add to Home Screen” for the PWA.

## Features

- Email sign up / sign in
- Household bootstrap (auto-created on first login)
- Multiple vehicles per household
- **Scan bill** — upload invoice → AI parse → review → confirm
- **Enter manually** — skip AI and log visits by hand
- Home “last service” summary, history, search

## Next

- Household email invites
- Mileage-since badges on last service

## Deploy to a public URL (Vercel — free)

Your app is a static site + Supabase backend. Hosting the site on **Vercel** gives you a URL like `https://garage-log.vercel.app`.

### 1. Push code to GitHub

Make sure your latest code is on GitHub (`shonethomas-wannabecoder/garage-log`).

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Add New → Project** → select **garage-log**
3. Framework preset: **Vite** (auto-detected)
4. Add **Environment Variables**:

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | `https://rmsqkjkpatjjpfcyjbos.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | your anon/publishable key from Supabase |

5. Click **Deploy**

You’ll get a URL like `https://garage-log-xxxx.vercel.app` — share that with anyone.

### 3. Allow login on the new URL (Supabase)

In Supabase → **Authentication** → **URL Configuration**:

- **Site URL**: your Vercel URL (e.g. `https://garage-log-xxxx.vercel.app`)
- **Redirect URLs** — add:
  - `https://garage-log-xxxx.vercel.app/**`
  - `https://*.vercel.app/**` (optional, for preview deploys)

Save, then test sign-in on the live site.

### 4. Invoice parsing

Already runs on Supabase (edge function + `ANTHROPIC_API_KEY`). No extra deploy step for the parser — only the frontend moves to Vercel.

### Alternatives

- **Netlify** or **Cloudflare Pages** — same idea: connect GitHub, set `VITE_*` env vars, deploy `dist` from `npm run build`
- **Custom domain** — Vercel → Project → Settings → Domains

