// API endpoint for updating zone settings
// URL: /api/zones/settings

export async function onRequestPatch(context) {
  const { request, env } = context;
  
  try {
    const data = await request.json();
    const { zone_ids, settings } = data;
    
    if (!zone_ids || !zone_ids.length) {
      return new Response(JSON.stringify({ error: 'Zone IDs are required' }), {
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
    
    // Prepare settings payload for Cloudflare API
    // Convert settings object to array format expected by Cloudflare API
    const settingsPayload = [];
    
    for (const [key, value] of Object.entries(settings)) {
      if (value === undefined || value === null) {
        continue; // Skip undefined/null values
      }
      
      // Handle different value types
      let apiValue;
      
      if (typeof value === 'boolean') {
        // Convert boolean to 'on'/'off' string
        apiValue = value ? 'on' : 'off';
      } else if (typeof value === 'number') {
        // Convert numbers to strings
        apiValue = value.toString();
      } else if (typeof value === 'object') {
        // For objects like minify, pass as-is
        apiValue = value;
      } else {
        // Strings and other types pass through
        apiValue = value;
      }
      
      settingsPayload.push({ id: key, value: apiValue });
    }
    
    if (settingsPayload.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid settings provided' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Update settings for each zone
    const updatePromises = zone_ids.map(async zoneId => {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: settingsPayload })
          }
        );
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          const errorMsg = result.errors && result.errors.length > 0 
            ? result.errors.map(e => e.message).join(', ')
            : `HTTP error! status: ${response.status}`;
          throw new Error(errorMsg);
        }
        
        return { success: true, zoneId };
      } catch (error) {
        console.error(`Error updating settings for zone ${zoneId}:`, error);
        return { success: false, zoneId, error: error.message };
      }
    });
    
    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(r => r.success).length;
    
    return new Response(JSON.stringify({
      updated_count: successfulUpdates,
      total_requested: zone_ids.length,
      results: results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Error in zones settings endpoint:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
