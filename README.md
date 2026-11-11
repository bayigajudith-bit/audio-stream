# Wavelane – Audiomack music browser (Vue 3 + TypeScript)

1. `npm install`
2. `cp .env.example .env` — keep `VITE_USE_MOCK=true` to try the UI with demo data.
3. `npm run dev` → http://localhost:5173

## Using the real Audiomack API
- Request API access from Audiomack to get a consumer key + secret.
- Put them in your environment (`AUDIOMACK_KEY`, `AUDIOMACK_SECRET`) and set `VITE_USE_MOCK=false`.
- `server/proxy.mjs` signs requests (OAuth 1.0a) so secrets never reach the browser.
- Verify endpoint paths and response fields in Audiomack's API docs, then adjust `src/api.ts` (`normalize`, `getTrending`, `search`).
