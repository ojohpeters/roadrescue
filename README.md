# Road Rescue

Production-ready roadside assistance web app. Drivers request help, mechanics accept jobs, admins monitor everything — all in real time.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Vercel Postgres / Supabase (PostgreSQL) |
| ORM | Prisma |
| Auth | NextAuth.js v5 (Google OAuth + Email/Password) |
| Real-time | Pusher |
| Maps | React-Leaflet + OpenStreetMap (no API key needed) |
| Icons | Lucide React |

## Features

- **Driver Flow** — One-tap geolocation, issue form, live status tracking, cancel
- **Mechanic Flow** — Live jobs feed, accept mission, on-the-way, complete
- **Admin Flow** — Live operations map, all requests table, user management
- **Real-time** — Pusher broadcasts all status changes instantly
- **Mobile-first** — 44px+ touch targets, high-contrast dark UI

## Local Development

### 1. Install

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
# Fill in all values
```

### 3. Database

```bash
npx prisma db push
npx prisma generate
```

### 4. Dev server

```bash
npm run dev
```

## Deploy to Vercel

1. Push to GitHub, import at vercel.com/new
2. Add all env vars from `.env.example`
3. `vercel.json` runs `prisma generate` automatically on build

### Required environment variables

| Variable | Source |
|---|---|
| `DATABASE_URL` | Vercel Postgres or Supabase |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | pusher.com (free Sandbox tier) |

## Roles

| Role | Dashboard | Access |
|---|---|---|
| `DRIVER` | `/dashboard/driver` | Submit & track own requests |
| `MECHANIC` | `/dashboard/mechanic` | View jobs, accept, complete |
| `ADMIN` | `/dashboard/admin` | All data, live map, user table |

To promote a user to admin:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

## Structure

```
src/
  app/
    (auth)/login|register/
    api/auth/[...nextauth]/  — NextAuth
    api/auth/register/       — Registration
    api/requests/[id]/       — Request CRUD
    api/users/               — Admin user list
    api/pusher/auth/         — Pusher channel auth
    dashboard/
      layout.tsx             — Nav + session guard
      driver|mechanic|admin/ — Role dashboards
  components/map/            — Leaflet maps
  lib/auth|prisma|pusher.ts
  middleware.ts              — Route protection
prisma/schema.prisma
```
# roadrescue
