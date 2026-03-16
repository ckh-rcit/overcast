// API endpoint to check if account ID is configured server-side
// URL: /api/config

export async function onRequest(context) {
  const { env } = context;
  
  return new Response(JSON.stringify({
    hasAccountId: !!env.CLOUDFLARE_ACCOUNT_ID,
    accountId: env.CLOUDFLARE_ACCOUNT_ID || null
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
