# Overcast

A batch management interface for Cloudflare zone settings, built with SvelteKit and deployed on Cloudflare Pages.

Overcast lets you select multiple zones and apply setting changes in bulk across 40+ settings in 7 categories, with real-time progress tracking and per-zone success/failure reporting.

## Features

- List all zones with their current settings (cache, TLS, HTTPS, dev mode, etc.)
- Select multiple zones and apply batch setting changes
- 40+ settings across 7 categories: Cache, SSL/TLS, Security, Network, Speed, Scrape Shield, and Other
- Real-time progress tracking with per-zone success/failure indicators

## Tech Stack

- SvelteKit 2 with Svelte 5 (runes mode)
- Tailwind CSS 4
- TypeScript
- Cloudflare Pages

## Prerequisites

- [Bun](https://bun.sh/) 1.3 or later
- A Cloudflare API token (see [API Token Permissions](#api-token-permissions))

## Setup

1. Install dependencies:

   ```sh
   bun install
   ```

2. Create a `.dev.vars` file with your Cloudflare API token:

   ```
   CLOUDFLARE_API_TOKEN=your_token_here
   ```

3. Start the development server:

   ```sh
   bun run dev
   ```

## Deployment

Build and deploy to Cloudflare Pages:

```sh
bun run build
wrangler pages deploy .svelte-kit/cloudflare --project-name overcast
```

Set the API token secret in your Pages project:

```sh
wrangler pages secret put CLOUDFLARE_API_TOKEN --project overcast
```

## Security

This application should not be deployed without authentication. Protect with [Cloudflare Access](https://www.cloudflare.com/products/zero-trust/access/) or equivalent.

## API Token Permissions

| Permission    | Access |
| ------------- | ------ |
| Zone          | Read   |
| Zone Settings | Edit   |

## Project Structure

```
src/
  lib/
    cloudflare.ts   # Cloudflare API client
    settings.ts     # Zone settings definitions and metadata
    types.ts        # TypeScript interfaces
  routes/
    +page.svelte    # Main application page
    +layout.svelte  # App shell and layout
    layout.css      # Global styles
    api/            # Server-side API proxy routes
```

## License

MIT
