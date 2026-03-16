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
    const accountId = url.searchParams.get('account_id');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const perPage = parseInt(url.searchParams.get('per_page')) || 20;
    
    if (!accountId) {
      return new Response(JSON.stringify({ error: 'Account ID is required' }), {
        status: 400,
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
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/zones?page=${page}&per_page=${perPage}`,
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
          
          // Extract specific settings we care about
          const settings = {};
          settingsData.result.forEach(setting => {
            if (setting.id === 'caching_level') {
              settings.caching_level = setting.value;
            } else if (setting.id === 'browser_cache_ttl') {
              settings.browser_cache_ttl = parseInt(setting.value) || 0;
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
