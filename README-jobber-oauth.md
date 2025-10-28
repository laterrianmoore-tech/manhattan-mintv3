# Jobber OAuth Integration for Netlify/Next.js Export

## Environment Variables (set in Netlify → Site settings → Environment variables)

- `JOBBER_CLIENT_ID` — Jobber OAuth client ID (server, secret)
- `JOBBER_CLIENT_SECRET` — Jobber OAuth client secret (server, secret)
- `JOBBER_OAUTH_REDIRECT_URI_PROD` — https://manhattanmintnyc.com/.netlify/functions/jobber-auth-callback
- `JOBBER_GRAPHQL_ENDPOINT` — https://api.getjobber.com/api/graphql
- `JOBBER_API_VERSION` — 2024-01
- `SITE_URL` — https://manhattanmintnyc.com
- `NEXT_PUBLIC_JOBBER_CLIENT_ID` — Jobber OAuth client ID (public, for client-side link)
- `NEXT_PUBLIC_JOBBER_REDIRECT` — https://manhattanmintnyc.com/.netlify/functions/jobber-auth-callback

## Production OAuth Callback URL

```
https://manhattanmintnyc.com/.netlify/functions/jobber-auth-callback
```

## How to Authorize

1. Deploy to Netlify with the above env vars set.
2. Visit `/booking/authorize` (hidden page).
3. Click "Authorize" and complete the Jobber OAuth prompt.
4. On success, you will be redirected to `/booking/connected`.

## Notes
- No Next.js API routes are used; only a Netlify Function for OAuth.
- Tokens are not persisted in this starter; add secure storage for production use.
- If you use a `_headers` file, do not duplicate headers in `netlify.toml`.
