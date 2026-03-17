# Overcast

Overcast is a tool for easily managing Cloudflare configurations across multiple zones in your account. Built with Cloudflare Pages for the frontend and Pages Functions for the secure API backend.

## ⚠️ Security Warning

**DO NOT deploy this application publicly without proper authentication!**

This application provides powerful zone management capabilities and should **ONLY** be accessible to authorized administrators. We strongly recommend:

### Recommended: Cloudflare Zero Trust Access

Protect your deployment using [Cloudflare Access](https://www.cloudflare.com/products/zero-trust/access/):

1. Go to **Zero Trust** → **Access** → **Applications**
2. Click **Add an application** → **Self-hosted**
3. Configure:
   - **Application name**: Overcast Zone Manager
   - **Session Duration**: As needed (e.g., 24 hours)
   - **Application domain**: `overcast.pages.dev` (or your custom domain)
4. Add an **Access Policy**:
   - **Policy name**: Administrators Only
   - **Action**: Allow
   - **Include**: Add rules for your team (e.g., Emails, Email domains, or Groups)
5. Save and deploy

This ensures only authenticated users from your organization can access the application.

### Alternative Options:

- **IP Restrictions**: Use Cloudflare WAF rules to allow only specific IP addresses
- **Cloudflare Tunnel**: Deploy behind a private tunnel with authentication
- **Custom Authentication**: Implement your own auth layer in Pages Functions

**Without protection, anyone who discovers your URL could potentially manage your Cloudflare zones.**

## Features

- **Comprehensive Zone Management**: List all zones in your Cloudflare account with pagination
- **Essential Settings Support**: Manage critical zone settings organized by category:
  - **Cache Settings**: Caching level, browser cache TTL, development mode
  - **SSL/TLS Settings**: Always Use HTTPS, minimum TLS version, automatic HTTPS rewrites
- **Batch Operations**: Apply settings to multiple zones simultaneously with detailed progress tracking
- **Real-time Progress Indicator**: Visual feedback showing success/failure for each zone with detailed error messages
- **Auto-refresh**: Zone list automatically updates after successful changes to show new values
- **Modern UI**: Pure black Vercel-inspired theme (#000000) with intuitive controls
- **Secure API Handling**: All API tokens stored server-side in environment secrets, never exposed to browser
- **Individual Setting Endpoints**: Uses modern Cloudflare API endpoints for reliable updates
- **Fully Cloudflare-Native**: Deployed on Cloudflare Pages with Pages Functions backend

## Architecture

This application is a full-stack Cloudflare Pages application:

1. **Frontend**: Static HTML/CSS/JS served by Cloudflare Pages (root directory)
2. **Backend**: Cloudflare Pages Functions that handle API calls (`/functions/api`)
   - `/api/config` - Check server configuration (Account ID requirement)
   - `/api/zones` - Lists zones and their settings
   - `/api/zones/settings` - Updates zone settings using individual setting endpoints

The application uses individual Cloudflare API endpoints for each setting:
- Format: `PATCH /zones/{zone_id}/settings/{setting_name}`
- Payload: `{ value: <value> }`
- This ensures compatibility with the latest Cloudflare API standards

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

4. **Add environment variables (REQUIRED):**
   - After the first deployment, go to **Settings** → **Environment variables**
   - Click **Add variable**
   
   **Add API Token:**
   - **Variable name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: Your Cloudflare API Token
   - **Environment**: Production (and optionally Preview)
   - **Type**: Encrypt (select the lock icon)
   - Click **Save**
   
   **Add Account ID (REQUIRED):**
   - Click **Add variable**
   - **Variable name**: `CLOUDFLARE_ACCOUNT_ID`
   - **Value**: Your Cloudflare Account ID (32-character hex string)
   - **Environment**: Production (and optionally Preview)
   - **Type**: Encrypt (select the lock icon)
   - Click **Save**

5. **Redeploy:**
   - Go to **Deployments** tab
   - Click **Retry deployment** on the latest deployment
   - Or simply push a new commit to trigger automatic deployment

6. **🔒 CRITICAL: Set up Cloudflare Access (Security)**
   
   **Before accessing your application**, protect it with authentication:
   
   - Go to **Zero Trust** → **Access** → **Applications**
   - Click **Add an application** → **Self-hosted**
   - Set **Application domain** to your Pages URL (e.g., `overcast.pages.dev`)
   - Add an **Access Policy** allowing only your team
   - Save and deploy
   
   See the [Security Warning](#️-security-warning) section above for detailed instructions.

7. **Access your application:**
   Your application will be available at `https://overcast.pages.dev` (after setting up Access)

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

4. **Set up environment secrets (REQUIRED):**
   ```bash
   bunx wrangler pages secret put CLOUDFLARE_API_TOKEN --project-name overcast
   ```
   When prompted, paste your Cloudflare API Token.
   
   ```bash
   bunx wrangler pages secret put CLOUDFLARE_ACCOUNT_ID --project-name overcast
   ```
   When prompted, paste your Cloudflare Account ID (required for the application to work).

5. **Deploy to Cloudflare Pages:**
   ```bash
   bun run deploy
   ```
   Or directly:
   ```bash
   bunx wrangler pages deploy . --project-name overcast
   ```

6. **🔒 Set up Cloudflare Access (Security):**
   Before accessing your application, protect it with authentication. See the [Security Warning](#️-security-warning) section for detailed setup instructions.

7. **Access your application:**
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

3. **Add environment variables (REQUIRED):**
   - After the first deployment, go to **Settings** → **Environment variables**
   
   **Add API Token:**
   - Click **Add variable**
   - **Variable name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: Your Cloudflare API Token
   - **Type**: Secret (encrypted)
   - Click **Save**
   
   **Add Account ID (REQUIRED):**
   - Click **Add variable**
   - **Variable name**: `CLOUDFLARE_ACCOUNT_ID`
   - **Value**: Your Cloudflare Account ID
   - **Type**: Secret (encrypted)
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments** and click **Retry deployment** for the latest deployment
   - Or push a new commit to trigger a new deployment

5. **🔒 Set up Cloudflare Access (Security):**
   Before accessing your application, protect it with authentication. See the [Security Warning](#️-security-warning) section for detailed setup instructions.

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

2. **Load your zones**
   - Click "Load Zones" to fetch all zones in your account
   - Adjust "Zones per page" if you have many zones
   - The Account ID is configured server-side for security

3. **View zone settings**
   - The table displays current settings for each zone:
     - **Status**: Active or inactive
     - **Caching**: Current cache level (Standard, No Query String, Ignore Query String)
     - **Browser TTL**: Browser cache TTL setting
     - **Dev Mode**: Development mode status (On/Off)
     - **Min TLS**: Minimum TLS version (1.0, 1.1, 1.2, 1.3)
     - **HTTPS**: Always Use HTTPS status (✓/✗)

4. **Select zones to update**
   - Use checkboxes to select individual zones
   - Or click "Select All" to select all zones on the current page
   - Selected count is displayed at the bottom

5. **Configure settings**
   
   **Cache Settings:**
   - **Caching Level**: Controls how Cloudflare caches content
     - Standard: Cache all static content
     - No Query String: Ignore query strings when caching
     - Ignore Query String: Treat URLs with query strings as the same file
   - **Browser Cache TTL**: How long browsers cache resources (0 = Respect Existing Headers, or specific time periods)
   - **Development Mode**: Temporarily bypass cache (automatically turns off after 3 hours)
   
   **SSL/TLS Settings:**
   - **Always Use HTTPS**: Redirect all HTTP requests to HTTPS
   - **Minimum TLS Version**: Set minimum TLS version (1.0, 1.1, 1.2, or 1.3)
   - **Automatic HTTPS Rewrites**: Automatically rewrite insecure URLs to HTTPS

6. **Apply settings**
   - Only changed settings will be applied (leave dropdown as "-- No Change --" to skip)
   - Toggle switches only apply when checked
   - Click "Apply Settings to Selected Zones"
   - Watch the progress indicator showing real-time updates for each zone
   - Zones automatically reload after 1 second to show updated values

7. **View results**
   - Progress indicator shows success (✓) or failure (✗) for each zone
   - Detailed error messages are displayed for any failures
   - Click "Dismiss" to close the progress indicator
   - The zone table refreshes automatically to display updated settings

## Development

To run this locally for development:

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up local environment variables:**
   Create a `.dev.vars` file in the root directory:
   ```
   CLOUDFLARE_API_TOKEN=your_token_here
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   ```
   
   **Note:** Both variables are required for the application to work.

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

**⚠️ CRITICAL: This application MUST be protected with authentication before production use!**

- **Use Cloudflare Access**: Protect your deployment with Zero Trust Access (recommended)
- **Never deploy publicly**: Without authentication, anyone can manage your Cloudflare zones
- **Production deployment example**: We protect our instance at `https://overcast.rivcoit.com` using Cloudflare Access with team authentication

**Additional security measures:**
- Your Cloudflare API Token is stored only in server-side environment variables, never exposed in the frontend
- Account ID is required server-side, preventing unauthorized access to zone management
- The Pages Functions act as a secure backend, adding credentials to requests before forwarding to Cloudflare API
- All communication is over HTTPS
- The API validates all inputs before making API calls
- Individual setting endpoints are used to ensure precise updates and better error handling

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
