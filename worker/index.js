// Cloudflare Worker for Overcast
// This worker proxies API calls to Cloudflare API with token stored in secrets

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Handle incoming requests
 * @param {Request} request
 */
async function handleRequest(request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  try {
    const url = new URL(request.url)
    const path = url.pathname
    
    // Route based on path
    if (path === '/zones') {
      return handleZonesRequest(request)
    } else if (path === '/zones/settings' && request.method === 'PATCH') {
      return handleZonesSettingsRequest(request)
    } else {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

/**
 * Handle zones listing request
 */
async function handleZonesRequest(request) {
  try {
    const url = new URL(request.url)
    const accountId = url.searchParams.get('account_id')
    const page = parseInt(url.searchParams.get('page')) || 1
    const perPage = parseInt(url.searchParams.get('per_page')) || 20
    
    if (!accountId) {
      return new Response(JSON.stringify({ error: 'Account ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get API token from secrets
    const apiToken = CLOUDFLARE_API_TOKEN
    if (!apiToken) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
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
    )
    
    if (!zonesResponse.ok) {
      const errorData = await zonesResponse.json()
      return new Response(JSON.stringify({ error: `Cloudflare API error: ${zonesResponse.status}` }), {
        status: zonesResponse.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const zonesData = await zonesResponse.json()
    
    if (!zonesData.success) {
      return new Response(JSON.stringify({ error: 'Failed to fetch zones from Cloudflare' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
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
          )
          
          if (!settingsResponse.ok) {
            return { ...zone, settings: {} }
          }
          
          const settingsData = await settingsResponse.json()
          
          if (!settingsData.success) {
            return { ...zone, settings: {} }
          }
          
          // Extract specific settings we care about
          const settings = {}
          settingsData.result.forEach(setting => {
            if (setting.id === 'caching_level') {
              settings.caching_level = setting.value
            } else if (setting.id === 'browser_cache_ttl') {
              settings.browser_cache_ttl = parseInt(setting.value) || 0
            }
          })
          
          return { ...zone, settings }
        } catch (error) {
          console.error(`Error fetching settings for zone ${zone.id}:`, error)
          return { ...zone, settings: {} }
        }
      })
    )
    
    return new Response(JSON.stringify({
      zones: zonesWithSettings,
      total_pages: Math.ceil(zonesData.result_info.count_per_page > 0 ? zonesData.result_info.total_count / zonesData.result_info.count_per_page : 1)
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('Error in handleZonesRequest:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * Handle zones settings update request
 */
async function handleZonesSettingsRequest(request) {
  try {
    const data = await request.json()
    const { account_id, zone_ids, settings } = data
    
    if (!account_id || !zone_ids || !zone_ids.length) {
      return new Response(JSON.stringify({ error: 'Account ID and zone IDs are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get API token from secrets
    const apiToken = CLOUDFLARE_API_TOKEN
    if (!apiToken) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Prepare settings payload for Cloudflare API
    const settingsPayload = []
    if (settings.caching_level !== undefined) {
      settingsPayload.push({ id: 'caching_level', value: settings.caching_level })
    }
    if (settings.browser_cache_ttl !== undefined && settings.browser_cache_ttl !== null) {
      settingsPayload.push({ id: 'browser_cache_ttl', value: settings.browser_cache_ttl.toString() })
    }
    
    if (settingsPayload.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid settings provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
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
            body: JSON.stringify(settingsPayload)
          }
        )
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        return { success: result.success, zoneId }
      } catch (error) {
        console.error(`Error updating settings for zone ${zoneId}:`, error)
        return { success: false, zoneId, error: error.message }
      }
    })
    
    const results = await Promise.all(updatePromises)
    const successfulUpdates = results.filter(r => r.success).length
    
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
    })
    
  } catch (error) {
    console.error('Error in handleZonesSettingsRequest:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}