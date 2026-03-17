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
    
    // Validate settings object
    if (!settings || Object.keys(settings).length === 0) {
      return new Response(JSON.stringify({ error: 'No valid settings provided' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Update settings for each zone
    // For each zone, we need to make a separate API call for each setting
    // API format: PATCH /zones/{zone_id}/settings/{setting_name}
    // Payload: { value: <value> }
    const updatePromises = zone_ids.map(async zoneId => {
      const settingResults = [];
      
      // Update each setting individually for this zone
      for (const [settingName, value] of Object.entries(settings)) {
        if (value === undefined || value === null) {
          continue; // Skip undefined/null values
        }
        
        try {
          // Handle different value types
          let apiValue;
          
          if (typeof value === 'boolean') {
            // Convert boolean to 'on'/'off' string
            apiValue = value ? 'on' : 'off';
          } else if (typeof value === 'number') {
            // Keep as number for numeric settings
            apiValue = value;
          } else if (typeof value === 'object') {
            // For objects like minify, pass as-is
            apiValue = value;
          } else {
            // Strings and other types pass through
            apiValue = value;
          }
          
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/${settingName}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ value: apiValue })
            }
          );
          
          const result = await response.json();
          
          if (!response.ok || !result.success) {
            const errorMsg = result.errors && result.errors.length > 0 
              ? result.errors.map(e => e.message).join(', ')
              : `HTTP error! status: ${response.status}`;
            settingResults.push({ setting: settingName, success: false, error: errorMsg });
          } else {
            settingResults.push({ setting: settingName, success: true });
          }
        } catch (error) {
          console.error(`Error updating setting ${settingName} for zone ${zoneId}:`, error);
          settingResults.push({ setting: settingName, success: false, error: error.message });
        }
      }
      
      // Check if all settings updated successfully
      const allSuccess = settingResults.every(r => r.success);
      const failedSettings = settingResults.filter(r => !r.success);
      
      if (allSuccess) {
        return { success: true, zoneId };
      } else {
        const errorMsg = failedSettings.map(s => `${s.setting}: ${s.error}`).join('; ');
        return { success: false, zoneId, error: errorMsg };
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
