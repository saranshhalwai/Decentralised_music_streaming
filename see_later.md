# See Later — Deferred Tasks

## 1. Pinata API Key Security (Server-Side Upload Proxy)

**Problem:**  
The `NEXT_PUBLIC_PINATA_JWT` variable is currently exposed to the browser in `frontend/.env.local`.  
Anyone can open Chrome DevTools → Network tab and steal the JWT to abuse your Pinata account.

**Planned Fix:**  
- Create a Next.js API route: `frontend/src/app/api/upload/route.ts`
- Move the Pinata fetch call from `lib/ipfs.ts` into this server-side route
- The server reads `process.env.PINATA_JWT` (no `NEXT_PUBLIC_` prefix → never sent to client)
- Frontend `lib/ipfs.ts` calls `/api/upload` instead of Pinata directly

**Changes Required When We Do This:**
1. `frontend/.env.example` — rename `NEXT_PUBLIC_PINATA_JWT` → `PINATA_JWT`
2. `frontend/src/lib/ipfs.ts` — change fetch target from Pinata to `/api/upload`
3. `frontend/src/app/api/upload/route.ts` — new file, server-side Pinata proxy
4. Existing `frontend/.env.local` — manually rename the variable

**Note:** This is a BREAKING change to the environment file. Requires a coordinated update.

## 2. Frontend Polish
- `dashboard/page.tsx` Add tabs
- `profile/page.tsx` Tip vs stream breakdown
