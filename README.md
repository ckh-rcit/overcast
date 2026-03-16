# Overcast

Overcast is a tool for easily managing Cloudflare configurations across multiple zones in your account. Built with Cloudflare Pages for the frontend and Pages Functions for the secure API backend.

## Features

- **Comprehensive Zone Management**: List all zones in your Cloudflare account with pagination
- **Extensive Settings Support**: Manage 40+ zone settings organized by category:
  - **Cache Settings**: Caching level, browser cache TTL, development mode, query string sorting
  - **SSL/TLS Settings**: Encryption mode, TLS versions, Always Use HTTPS, automatic HTTPS rewrites
  - **Security Settings**: Security level, challenge TTL, browser integrity check, WAF
  - **Network Settings**: HTTP/2, HTTP/3, IPv6, WebSockets, IP geolocation
  - **Speed & Optimization**: Brotli, early hints, Rocket Loader, Polish, WebP, minification
  - **Scrape Shield**: Email obfuscation, hotlink protection, server-side excludes
- **Batch Operations**: Apply settings to multiple zones simultaneously
- **Modern UI**: Cloudflare-inspired dark theme with intuitive controls
- **Secure API Handling**: All API tokens stored in environment secrets, never exposed to browser
- **Fully Cloudflare-Native**: Deployed on Cloudflare Pages with Pages Functions backend

## Architecture

This application is a full-stack Cloudflare Pages application:

1. **Frontend**: Static HTML/CSS/JS served by Cloudflare Pages (root directory)
2. **Backend**: Cloudflare Pages Functions that handle API calls (`/functions/api`)
   - `/api/zones` - Lists zones and their settings
   - `/api/zones/settings` - Updates zone settings

The API token is stored securely in environment variables and never exposed to the browser.

## Deployment Instructions

### Prerequisites

- [Bun](https://bun.sh) installed (or Node.js and npm)
- A Cloudflare account
- Cloudflare API Token with the following permissions:
  - **Zone** → **Zone** → **Read**
  - **Zone** → **Zone Settings** → **Read**
  - **Zone** → **Zone Settings** → **Edit**

#### Creating Your API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Click **Create Custom Token**
4. Give it a name (e.g., "Overcast Zone Management")
5. Add the permissions:
   - **Permissions:**
     - Zone → Zone → Read
     - Zone → Zone Settings → Read
     - Zone → Zone Settings → Edit
   - **Account Resources:**
     - Include → All accounts (or select specific account)
   - **Zone Resources:**
     - Include → All zones (or select specific zones)
6. Click **Continue to summary**
7. Click **Create Token**
8. **Copy the token** - you won't be able to see it again!

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
   - **Build output directory**: `/` (root directory)
   - Click **Save and Deploy**

4. **Add environment variable:**
   - After the first deployment, go to **Settings** → **Environment variables**
   - Click **Add variable**
   - **Variable name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: Your Cloudflare API Token
   - **Environment**: Production (and optionally Preview)
   - **Type**: Encrypt (select the lock icon)
   - Click **Save**
   
   **Optional:** You can also configure the Account ID as an environment variable:
   - **Variable name**: `CLOUDFLARE_ACCOUNT_ID`
   - **Value**: Your Cloudflare Account ID (32-character hex string)
   - **Environment**: Production (and optionally Preview)
   - Click **Save**
   - When configured, users won't need to enter the Account ID manually

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
   
   **Optional:** Configure the Account ID as a secret:
   ```bash
   bunx wrangler pages secret put CLOUDFLARE_ACCOUNT_ID --project-name overcast
   ```
   When prompted, paste your Cloudflare Account ID. This allows users to skip entering it manually.

5. **Deploy to Cloudflare Pages:**
   ```bash
   bun run deploy
   ```
   Or directly:
   ```bash
   bunx wrangler pages deploy . --project-name overcast
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
   - **Build output directory**: `/` (root directory)

3. **Add environment variable:**
   - After the first deployment, go to **Settings** → **Environment variables**
   - Add a variable:
     - **Variable name**: `CLOUDFLARE_API_TOKEN`
     - **Value**: Your Cloudflare API Token
     - **Type**: Secret (encrypted)
   - Click **Save**
   
   **Optional:** Add Account ID as an environment variable:
   - **Variable name**: `CLOUDFLARE_ACCOUNT_ID`
   - **Value**: Your Cloudflare Account ID
   - **Type**: Secret (encrypted)
   - Click **Save**
   - When configured, users won't need to enter it manually

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

1. **Access your application** at your Overcast URL (e.g., `https://overcast.pages.dev`)

2. **Enter your Cloudflare Account ID** (if not configured server-side)
   - Find this in your Cloudflare dashboard under Account Settings
   - Or in the URL when viewing your account: `dash.cloudflare.com/<ACCOUNT_ID>`
   - If the Account ID is configured as an environment variable, this field will be pre-filled and disabled

3. **Load your zones**
   - Click "Load Zones" to fetch all zones in your account
   - Adjust "Zones per page" if you have many zones

4. **Select zones to update**
   - Use checkboxes to select individual zones
   - Or click "Select All" to select all zones on the current page
   - Selected count is displayed at the bottom

5. **Configure settings by category**
   
   **Cache Settings:**
   - Caching Level: Controls how Cloudflare caches content
   - Browser Cache TTL: How long browsers cache resources
   - Development Mode: Temporarily bypass cache
   - Sort Query Strings: Improve cache hit rates
   
   **SSL/TLS Settings:**
   - SSL Mode: Off, Flexible, Full, or Full (Strict)
   - TLS Versions: Minimum TLS version and TLS 1.3 settings
   - Always Use HTTPS: Redirect HTTP to HTTPS
   - Automatic HTTPS Rewrites: Fix mixed content warnings
   
   **Security Settings:**
   - Security Level: Threat sensitivity (Off to Under Attack)
   - Challenge TTL: How long visitors stay verified
   - Browser Integrity Check: Evaluate headers for threats
   - WAF: Web Application Firewall
   
   **Network Settings:**
   - HTTP/2 & HTTP/3: Enable modern protocols
   - IPv6: Enable IPv6 support
   - WebSockets: Allow WebSocket connections
   - IP Geolocation: Add country code header
   
   **Speed & Optimization:**
   - Brotli: Better compression for HTTPS
   - Rocket Loader: Defer JavaScript loading
   - Polish: Automatic image optimization
   - WebP: Serve modern image format
   - Mirage: Optimize for mobile
   
   **Scrape Shield:**
   - Email Obfuscation: Hide emails from bots
   - Hotlink Protection: Prevent image theft
   - Server Side Excludes: Block content from bots

6. **Apply settings**
   - Only changed settings will be applied (leave dropdown as "-- No Change --" to skip)
   - Toggle switches only apply when checked (for enabling features)
   - Click "Apply Settings to Selected Zones"
   - Confirm the action in the dialog
   - Wait for success confirmation

7. **View results**
   - Success message shows how many zones were updated
   - Zone list refreshes automatically to show new settings
   - Any errors are displayed with details

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
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here  # Optional
   ```

3. **Run the development server:**
   ```bash
   bun run dev
   ```
   Or directly:
   ```bash
   bunx wrangler pages dev .
   ```

4. **Access the local application:**
   Open your browser to `http://localhost:8788`

The development server will automatically reload when you make changes to your files.

## Security Notes

- Your Cloudflare API Token is stored only in environment variables, never exposed in the frontend
- The Pages Functions act as a secure backend, adding your token to requests before forwarding to Cloudflare API
- All communication is over HTTPS
- The API validates all inputs before making API calls

## Environment Variables

This application uses the following environment variables:

### Required
- **`CLOUDFLARE_API_TOKEN`**: Your Cloudflare API token with zone and zone settings permissions
  - Type: Secret (encrypted)
  - Required for all API operations
  - Never exposed to the frontend

### Optional
- **`CLOUDFLARE_ACCOUNT_ID`**: Your Cloudflare Account ID (32-character hex string)
  - Type: Secret (encrypted)
  - When configured: Users are automatically authenticated and don't need to enter Account ID
  - When not configured: Users must enter their Account ID in the UI
  - Useful for single-tenant deployments or internal tools

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
