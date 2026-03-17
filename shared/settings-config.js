// Centralized configuration for all Cloudflare zone settings
// This defines which settings we support and their metadata for rendering

export const ZONE_SETTINGS = [
  // Cache Settings
  {
    id: 'cache_level',
    label: 'Caching Level',
    category: 'cache',
    type: 'select',
    options: [
      { value: 'aggressive', label: 'Standard' },
      { value: 'basic', label: 'No Query String' },
      { value: 'simplified', label: 'Ignore Query String' }
    ],
    description: 'Determines how much of the website content Cloudflare caches'
  },
  {
    id: 'browser_cache_ttl',
    label: 'Browser Cache TTL',
    category: 'cache',
    type: 'select',
    options: [
      { value: 0, label: 'Respect Existing Headers' },
      { value: 30, label: '30 seconds' },
      { value: 60, label: '1 minute' },
      { value: 300, label: '5 minutes' },
      { value: 1200, label: '20 minutes' },
      { value: 1800, label: '30 minutes' },
      { value: 3600, label: '1 hour' },
      { value: 7200, label: '2 hours' },
      { value: 10800, label: '3 hours' },
      { value: 14400, label: '4 hours' },
      { value: 18000, label: '5 hours' },
      { value: 28800, label: '8 hours' },
      { value: 43200, label: '12 hours' },
      { value: 57600, label: '16 hours' },
      { value: 72000, label: '20 hours' },
      { value: 86400, label: '1 day' },
      { value: 172800, label: '2 days' },
      { value: 259200, label: '3 days' },
      { value: 345600, label: '4 days' },
      { value: 432000, label: '5 days' },
      { value: 691200, label: '8 days' },
      { value: 1382400, label: '16 days' },
      { value: 2678400, label: '31 days' },
      { value: 5356800, label: '2 months' },
      { value: 16070400, label: '6 months' },
      { value: 31536000, label: '1 year' }
    ],
    description: 'Determines the length of time resources are cached by client browsers'
  },
  {
    id: 'development_mode',
    label: 'Development Mode',
    category: 'cache',
    type: 'toggle',
    description: 'Temporarily bypass cache (automatically turns off after 3 hours)'
  },
  {
    id: 'sort_query_string_for_cache',
    label: 'Sort Query String for Cache',
    category: 'cache',
    type: 'toggle',
    description: 'Improve cache hit rates by sorting query parameters'
  },
  
  // SSL/TLS Settings
  {
    id: 'ssl',
    label: 'SSL/TLS Encryption Mode',
    category: 'ssl',
    type: 'select',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'flexible', label: 'Flexible' },
      { value: 'full', label: 'Full' },
      { value: 'strict', label: 'Full (Strict)' }
    ],
    description: 'Controls how Cloudflare connects to your origin server'
  },
  {
    id: 'always_use_https',
    label: 'Always Use HTTPS',
    category: 'ssl',
    type: 'toggle',
    description: 'Redirect all requests with scheme "http" to "https"'
  },
  {
    id: 'min_tls_version',
    label: 'Minimum TLS Version',
    category: 'ssl',
    type: 'select',
    options: [
      { value: '1.0', label: 'TLS 1.0' },
      { value: '1.1', label: 'TLS 1.1' },
      { value: '1.2', label: 'TLS 1.2' },
      { value: '1.3', label: 'TLS 1.3' }
    ],
    description: 'Minimum version of TLS required for connections'
  },
  {
    id: 'tls_1_3',
    label: 'TLS 1.3',
    category: 'ssl',
    type: 'select',
    options: [
      { value: 'on', label: 'Enabled' },
      { value: 'off', label: 'Disabled' },
      { value: 'zrt', label: 'Enabled + 0-RTT' }
    ],
    description: 'Enable TLS 1.3 for improved performance and security'
  },
  {
    id: 'automatic_https_rewrites',
    label: 'Automatic HTTPS Rewrites',
    category: 'ssl',
    type: 'toggle',
    description: 'Automatically rewrite insecure URLs to HTTPS'
  },
  {
    id: 'opportunistic_encryption',
    label: 'Opportunistic Encryption',
    category: 'ssl',
    type: 'toggle',
    description: 'Enable HTTP/2 Server Push for browsers to request resources over encrypted connection'
  },
  
  // Security Settings
  {
    id: 'security_level',
    label: 'Security Level',
    category: 'security',
    type: 'select',
    options: [
      { value: 'off', label: 'Essentially Off' },
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'under_attack', label: 'I\'m Under Attack!' }
    ],
    description: 'Controls Cloudflare threat level sensitivity'
  },
  {
    id: 'challenge_ttl',
    label: 'Challenge TTL',
    category: 'security',
    type: 'select',
    options: [
      { value: 300, label: '5 minutes' },
      { value: 900, label: '15 minutes' },
      { value: 1800, label: '30 minutes' },
      { value: 2700, label: '45 minutes' },
      { value: 3600, label: '1 hour' },
      { value: 7200, label: '2 hours' },
      { value: 10800, label: '3 hours' },
      { value: 14400, label: '4 hours' },
      { value: 28800, label: '8 hours' },
      { value: 57600, label: '16 hours' },
      { value: 86400, label: '1 day' },
      { value: 604800, label: '1 week' },
      { value: 2592000, label: '1 month' },
      { value: 31536000, label: '1 year' }
    ],
    description: 'Time period that a visitor will be allowed access before being challenged again'
  },
  {
    id: 'browser_check',
    label: 'Browser Integrity Check',
    category: 'security',
    type: 'toggle',
    description: 'Evaluate HTTP headers from your visitors browser for threats'
  },
  {
    id: 'privacy_pass',
    label: 'Privacy Pass Support',
    category: 'security',
    type: 'toggle',
    description: 'Support Privacy Pass for less intrusive challenges'
  },
  {
    id: 'security_header',
    label: 'Security Headers',
    category: 'security',
    type: 'toggle',
    description: 'Enable various security headers'
  },
  
  // Network Settings
  {
    id: 'http2',
    label: 'HTTP/2',
    category: 'network',
    type: 'toggle',
    description: 'Enable HTTP/2 for improved performance'
  },
  {
    id: 'http3',
    label: 'HTTP/3 (with QUIC)',
    category: 'network',
    type: 'toggle',
    description: 'Enable HTTP/3 protocol with QUIC'
  },
  {
    id: 'ipv6',
    label: 'IPv6 Compatibility',
    category: 'network',
    type: 'toggle',
    description: 'Enable IPv6 support for your domain'
  },
  {
    id: 'websockets',
    label: 'WebSockets',
    category: 'network',
    type: 'toggle',
    description: 'Allow WebSocket connections'
  },
  {
    id: 'pseudo_ipv4',
    label: 'Pseudo IPv4',
    category: 'network',
    type: 'select',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'add_header', label: 'Add Header' },
      { value: 'overwrite_header', label: 'Overwrite Header' }
    ],
    description: 'Add IPv4 header to requests when IPv6 is in use'
  },
  {
    id: 'ip_geolocation',
    label: 'IP Geolocation Header',
    category: 'network',
    type: 'toggle',
    description: 'Include the country code of the visitor location with all requests'
  },
  
  // Speed/Optimization Settings
  {
    id: 'brotli',
    label: 'Brotli Compression',
    category: 'speed',
    type: 'toggle',
    description: 'Speed up page load times for visitor\'s HTTPS traffic by applying Brotli compression'
  },
  {
    id: 'early_hints',
    label: 'Early Hints',
    category: 'speed',
    type: 'toggle',
    description: 'Send Early Hints headers to speed up page rendering'
  },
  {
    id: 'h2_prioritization',
    label: 'HTTP/2 Prioritization',
    category: 'speed',
    type: 'toggle',
    description: 'Optimize the delivery of resources'
  },
  {
    id: 'minify',
    label: 'Auto Minify',
    category: 'speed',
    type: 'object',
    subfields: ['css', 'html', 'js'],
    description: 'Automatically minify HTML, CSS, and JavaScript'
  },
  {
    id: 'mirage',
    label: 'Mirage',
    category: 'speed',
    type: 'toggle',
    description: 'Automatically optimize image loading for mobile devices'
  },
  {
    id: 'polish',
    label: 'Polish',
    category: 'speed',
    type: 'select',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'lossless', label: 'Lossless' },
      { value: 'lossy', label: 'Lossy' }
    ],
    description: 'Automatic image optimization'
  },
  {
    id: 'webp',
    label: 'WebP',
    category: 'speed',
    type: 'toggle',
    description: 'Serve WebP images when supported by the client'
  },
  {
    id: 'rocket_loader',
    label: 'Rocket Loader',
    category: 'speed',
    type: 'toggle',
    description: 'Automatically defer loading of JavaScript'
  },
  {
    id: 'prefetch_preload',
    label: 'Prefetch URLs',
    category: 'speed',
    type: 'toggle',
    description: 'Cloudflare will prefetch URLs included in the response headers'
  },
  
  // Scrape Shield Settings
  {
    id: 'email_obfuscation',
    label: 'Email Obfuscation',
    category: 'scrape_shield',
    type: 'toggle',
    description: 'Hide email addresses on your web page from bots'
  },
  {
    id: 'server_side_exclude',
    label: 'Server Side Excludes',
    category: 'scrape_shield',
    type: 'toggle',
    description: 'Prevent specific content from suspicious visitors'
  },
  {
    id: 'hotlink_protection',
    label: 'Hotlink Protection',
    category: 'scrape_shield',
    type: 'toggle',
    description: 'Protect your images from off-site linking'
  },
  
  // Other Settings
  {
    id: 'origin_error_page_pass_thru',
    label: 'Origin Error Page Pass-thru',
    category: 'other',
    type: 'toggle',
    description: 'Serve error pages directly from the origin server'
  },
  {
    id: 'origin_max_http_version',
    label: 'Origin Max HTTP Version',
    category: 'other',
    type: 'select',
    options: [
      { value: '1', label: 'HTTP/1' },
      { value: '2', label: 'HTTP/2' }
    ],
    description: 'Maximum HTTP version to use for origin connections'
  },
  {
    id: 'opportunistic_onion',
    label: 'Onion Routing',
    category: 'other',
    type: 'toggle',
    description: 'Route known Tor users to your onion address'
  },
  {
    id: 'orange_to_orange',
    label: 'Orange to Orange (O2O)',
    category: 'other',
    type: 'toggle',
    description: 'Enable direct connections between Cloudflare zones'
  },
  {
    id: 'response_buffering',
    label: 'Response Buffering',
    category: 'other',
    type: 'toggle',
    description: 'Buffer responses before sending to visitors'
  },
  {
    id: 'true_client_ip_header',
    label: 'True Client IP Header',
    category: 'other',
    type: 'toggle',
    description: 'Send the end user\'s IP address in the True-Client-IP header'
  },
  {
    id: 'waf',
    label: 'Web Application Firewall (WAF)',
    category: 'security',
    type: 'toggle',
    description: 'Enable WAF managed rules'
  }
];

// Helper function to get setting by ID
export function getSettingById(id) {
  return ZONE_SETTINGS.find(s => s.id === id);
}

// Helper function to get settings by category
export function getSettingsByCategory(category) {
  return ZONE_SETTINGS.filter(s => s.category === category);
}

// Get all categories
export function getCategories() {
  const categories = [...new Set(ZONE_SETTINGS.map(s => s.category))];
  return categories.map(cat => ({
    id: cat,
    label: cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }));
}

// Category display order
export const CATEGORY_ORDER = ['cache', 'ssl', 'security', 'network', 'speed', 'scrape_shield', 'other'];
