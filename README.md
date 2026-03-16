# Overcast

Overcast is a tool for easily managing Cloudflare configurations across multiple zones in your account. Built with Cloudflare Pages for the frontend and Pages Functions for the secure API backend.

## Features

- List all zones in your Cloudflare account with pagination (supports 50+ zones)
- View current settings for each zone (caching level, browser cache TTL)
- Batch update settings across multiple selected zones
- Secure handling of Cloudflare API tokens (stored in environment secrets)
- Responsive design for desktop and mobile use
- Fully deployed on Cloudflare infrastructure

## Architecture

This application is a full-stack Cloudflare Pages application:

1. **Frontend**: Static HTML/CSS/JS served by Cloudflare Pages (`/frontend`)
2. **Backend**: Cloudflare Pages Functions that handle API calls (`/frontend/functions/api`)
   - `/api/zones` - Lists zones and their settings
   - `/api/zones/settings` - Updates zone settings

The API token is stored securely in environment variables and never exposed to the browser.

## Deployment Instructions

### Prerequisites

- [Bun](https://bun.sh) installed (or Node.js and npm)
- A Cloudflare account
- Cloudflare API Token with the following permissions:
  - Account.Zones:Read
  - Zone.Settings:Read
  - Zone.Settings:Edit

### Option 1: Automatic Deployment via GitHub (Recommended)

This method automatically deploys your application whenever you push to GitHub.

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add -A
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Cloudflare Pages:**
   - Go to your [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**
   - Authorize Cloudflare to access your GitHub account
   - Select the `overcast` repository

3. **Configure the build settings:**
   - **Project name**: `overcast`
   - **Production branch**: `main`
   - **Build command**: (leave empty - no build needed)
   - **Build output directory**: `frontend`
   - Click **Save and Deploy**

4. **Add environment variable:**
   - After the first deployment, go to **Settings** → **Environment variables**
   - Click **Add variable**
   - **Variable name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: Your Cloudflare API Token
   - **Environment**: Production (and optionally Preview)
   - **Type**: Encrypt (select the lock icon)
   - Click **Save**

5. **Redeploy:**
   - Go to **Deployments** tab
   - Click **Retry deployment** on the latest deployment
   - Or simply push a new commit to trigger automatic deployment

6. **Access your application:**
   Your application will be available at `https://overcast.pages.dev`

**Future deployments:** From now on, every push to the `main` branch will automatically deploy to production!

### Option 2: Manual Deploy with Wrangler CLI

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Login to Cloudflare:**
   ```bash
   bunx wrangler login
   ```

3. **Create the Pages project:**
   ```bash
   bunx wrangler pages project create overcast
   ```

4. **Set up the API token secret:**
   ```bash
   bunx wrangler pages secret put CLOUDFLARE_API_TOKEN --project-name overcast
   ```
   When prompted, paste your Cloudflare API Token.

5. **Deploy to Cloudflare Pages:**
   ```bash
   bun run deploy
   ```
   Or directly:
   ```bash
   bunx wrangler pages deploy frontend --project-name overcast
   ```

6. **Access your application:**
   Your application will be available at `https://overcast.pages.dev`
   (or your custom domain if configured)

### Option 3: Deploy via Cloudflare Dashboard (without Git)

1. **Connect your Git repository:**
   - Go to your [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**
   - Select your repository and authorize Cloudflare

2. **Configure the build settings:**
   - **Project name**: `overcast`
   - **Production branch**: `main` (or your default branch)
   - **Build command**: (leave empty - no build needed)
   - **Build output directory**: `frontend`

3. **Add environment variable:**
   - After the first deployment, go to **Settings** → **Environment variables**
   - Add a variable:
     - **Variable name**: `CLOUDFLARE_API_TOKEN`
     - **Value**: Your Cloudflare API Token
     - **Type**: Secret (encrypted)
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments** and click **Retry deployment** for the latest deployment
   - Or push a new commit to trigger a new deployment

### Custom Domain (Optional)

To use a custom domain:

1. Go to your Pages project in the Cloudflare Dashboard
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain and follow the instructions

## Making Changes and Deploying Updates

If you set up automatic deployment via GitHub (Option 1):

1. **Make your changes locally**
2. **Commit and push:**
   ```bash
   git add -A
   git commit -m "Description of your changes"
   git push
   ```
3. **Automatic deployment:** Cloudflare Pages will automatically detect the push and deploy your changes
4. **Monitor deployment:** Watch the progress in the Cloudflare Dashboard under **Deployments**

Deployment typically takes 1-2 minutes. You'll get a unique URL for each deployment, and successful deployments are automatically promoted to production.

## Usage

1. Visit your Overcast URL (e.g., `https://overcast.pages.dev`)
2. Enter your Cloudflare Account ID (found in your Cloudflare dashboard under Account Settings)
3. Click "Load Zones" to fetch your zones
4. Select zones using checkboxes (use "Select All" for all zones on current page)
5. Configure the settings you want to apply:
   - Caching Level: Off, Basic, Simplified, Aggressive
   - Browser Cache TTL: Enter value in seconds or with suffixes (s, m, h, d)
6. Click "Apply Settings to Selected Zones"
7. Confirm the action in the popup dialog

## Development

To run this locally for development:

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up local environment variable:**
   Create a `.dev.vars` file in the root directory:
   ```
   CLOUDFLARE_API_TOKEN=your_token_here
   ```

3. **Run the development server:**
   ```bash
   bun run dev
   ```
   Or directly:
   ```bash
   bunx wrangler pages dev frontend
   ```

4. **Access the local application:**
   Open your browser to `http://localhost:8788`

The development server will automatically reload when you make changes to your files.

## Security Notes

- Your Cloudflare API Token is stored only in environment variables, never exposed in the frontend
- The Pages Functions act as a secure backend, adding your token to requests before forwarding to Cloudflare API
- All communication is over HTTPS
- The API validates all inputs before making API calls

## Project Structure

```
overcast/
├── frontend/
│   ├── functions/          # Cloudflare Pages Functions (API backend)
│   │   └── api/
│   │       ├── zones.js    # GET /api/zones - List zones with settings
│   │       └── zones/
│   │           └── settings.js  # PATCH /api/zones/settings - Update settings
│   ├── index.html          # Main frontend page
│   ├── script.js           # Frontend JavaScript
│   └── style.css           # Styles
├── worker/                 # Legacy worker code (deprecated)
├── wrangler.toml          # Cloudflare Pages configuration
└── package.json           # Node.js dependencies
```

## License

MIT
