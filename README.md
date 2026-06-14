# Garage Log

Phone-first PWA to log car repair invoices and pull up your last service at the shop.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (auth, Postgres, storage)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Supabase project**

   - Create a project at [supabase.com](https://supabase.com)
   - In the SQL editor, run `supabase/migrations/001_initial_schema.sql`
   - Under Authentication → Providers, enable Email
   - Copy Project URL and anon key from Settings → API

3. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

4. **Run**

   ```bash
   npm run dev
   ```

   Open the URL on your phone and use “Add to Home Screen” for the PWA.

## Week 1 (current)

- Email sign up / sign in
- Household bootstrap (auto-created on first login)
- Multiple vehicles per household
- Manual service visit entry with line items
- Invoice file upload to storage
- Home “last service” summary, history, search

## Next

- AI invoice parsing + review screen
- Household email invites
- Mileage-since badges on last service
