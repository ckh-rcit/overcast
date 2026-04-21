# Overcast

Batch-manage Cloudflare zone settings across multiple zones from a single UI. Built with **SvelteKit 2** + **Svelte 5** on **Cloudflare Pages**.

## Security

**Do not deploy without authentication.** Protect with [Cloudflare Access](https://www.cloudflare.com/products/zero-trust/access/) or equivalent.

## Features

- List all zones with current settings (cache, TLS, HTTPS, dev mode, etc.)
- Select multiple zones and apply batch setting changes
- 40+ settings across 7 categories (Cache, SSL/TLS, Security, Network, Speed, Scrape Shield, Other)
- Real-time progress tracking with per-zone success/failure
- Dark OKLCH theme with JetBrains Mono

## Architecture

SvelteKit app deployed to Cloudflare Pages:

- **Frontend**: Svelte 5 (runes mode) + Tailwind CSS 4
- **Backend**: SvelteKit server routes → Cloudflare API
  - `GET /api/zones` — list zones with settings
  - `PATCH /api/zones/settings` — batch update zone settings
- **Auth**: `CLOUDFLARE_API_TOKEN` stored server-side, never exposed to browser

## Setup

### Prerequisites

- [Bun](https://bun.sh) (or Node.js)
- Cloudflare API Token with permissions:
  - Zone → Zone → Read
  - Zone → Zone Settings → Read
  - Zone → Zone Settings → Edit

### Development

```bash
bun install
bun run dev
```

Set `CLOUDFLARE_API_TOKEN` in a `.dev.vars` file:

```
CLOUDFLARE_API_TOKEN=your_token_here
```

### Deploy

```bash
bun run build
wrangler pages deploy .svelte-kit/cloudflare --project-name overcast
wrangler pages secret put CLOUDFLARE_API_TOKEN --project overcast
```


**Recommended Access Configuration:**
- Policy: Allow only specific email addresses or email domains
- Session Duration: 8-24 hours (balance security and convenience)
- Require MFA: Enable multi-factor authentication for added security
- Audit Logs: Monitor who accesses the application via Zero Trust logs

## Environment Variables

This application uses the following environment variables:

### Required Environment Variable

- **`CLOUDFLARE_API_TOKEN`**: Your Cloudflare API token with zone and zone settings permissions
  - Type: Secret (encrypted)
  - Required for all API operations
  - Never exposed to the frontend
  
**Required Permissions:**
- Zone → Zone → Read
- Zone → Zone Settings → Read  
- Zone → Zone Settings → Write

### Required Server-Side Configuration

- **`CLOUDFLARE_ACCOUNT_ID`**: Your Cloudflare Account ID (32-character hex string)
  - Type: Secret (encrypted)
  - **REQUIRED** - Must be configured server-side
  - Users cannot access the application without this configured
  - This is a security measure to prevent unauthorized access

To set these in production:
1. Go to your Pages project → **Settings** → **Environment variables**
2. Click **Add variable** for each one
3. Select **Encrypt** for sensitive values

For local development, create a `.dev.vars` file (see Development section above).

## Project Structure

```
overcast/
├── functions/              # Cloudflare Pages Functions (API backend)
│   └── api/
│       ├── config.js       # GET /api/config - Check server configuration
│       ├── zones.js        # GET /api/zones - List zones with settings
│       └── zones/
│           └── settings.js # PATCH /api/zones/settings - Update settings
├── shared/                 # Shared configuration
│   └── settings-config.js  # Zone settings definitions and metadata
├── index.html              # Main frontend page
├── script.js               # Frontend JavaScript (ES6 modules)
├── style.css               # Cloudflare dark theme styles
├── wrangler.toml          # Cloudflare Pages configuration
├── package.json           # Dependencies and scripts
├── bun.lock              # Bun lockfile
└── .gitignore            # Git ignore rules
```

## License

MIT
