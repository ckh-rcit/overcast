// API endpoint for listing zones
// URL: /api/zones

export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const perPage = parseInt(url.searchParams.get('per_page')) || 20;
    
    // Get account ID from environment variable (required)
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    
    if (!accountId) {
      return new Response(JSON.stringify({ 
        error: 'CLOUDFLARE_ACCOUNT_ID environment variable is not configured. Please contact your administrator.' 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Get API token from environment
    const apiToken = env.CLOUDFLARE_API_TOKEN;
    if (!apiToken) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Call Cloudflare API to list zones
    const zonesResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones?account.id=${accountId}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!zonesResponse.ok) {
      return new Response(JSON.stringify({ error: `Cloudflare API error: ${zonesResponse.status}` }), {
        status: zonesResponse.status,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const zonesData = await zonesResponse.json();
    
    if (!zonesData.success) {
      return new Response(JSON.stringify({ error: 'Failed to fetch zones from Cloudflare' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Fetch settings for each zone in parallel
    const zonesWithSettings = await Promise.all(
      zonesData.result.map(async zone => {
        try {
          const settingsResponse = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zone.id}/settings`,
            {
              headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (!settingsResponse.ok) {
            return { ...zone, settings: {} };
          }
          
          const settingsData = await settingsResponse.json();
          
          if (!settingsData.success) {
            return { ...zone, settings: {} };
          }
          
          // Extract all settings - convert the array to an object keyed by setting ID
          const settings = {};
          settingsData.result.forEach(setting => {
            // Store the value, handling special cases
            if (setting.id === 'minify') {
              // Minify is an object with css/html/js subfields
              settings[setting.id] = setting.value;
            } else if (setting.id === 'browser_cache_ttl') {
              // Convert to integer for easier handling
              settings[setting.id] = parseInt(setting.value) || 0;
            } else if (typeof setting.value === 'string' && (setting.value === 'on' || setting.value === 'off')) {
              // Convert on/off strings to booleans for toggles
              settings[setting.id] = setting.value === 'on';
            } else {
              // Store value as-is
              settings[setting.id] = setting.value;
            }
          });
          
          return { ...zone, settings };
        } catch (error) {
          console.error(`Error fetching settings for zone ${zone.id}:`, error);
          return { ...zone, settings: {} };
        }
      })
    );
    
    return new Response(JSON.stringify({
      zones: zonesWithSettings,
      total_pages: Math.ceil(zonesData.result_info.count_per_page > 0 ? zonesData.result_info.total_count / zonesData.result_info.count_per_page : 1)
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Error in zones endpoint:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
