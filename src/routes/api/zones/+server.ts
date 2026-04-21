import { json } from '@sveltejs/kit';
import { listZones } from '$lib/cloudflare';

export async function GET() {
	try {
		const zones = await listZones();
		return json({ zones });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unable to load zones';
		return json({ error: message }, { status: 500 });
	}
}
