import { json } from '@sveltejs/kit';
import { patchZoneSetting } from '$lib/cloudflare';

export async function PATCH({ request }: { request: Request }) {
	try {
		const body = await request.json();
		const { zone_ids, settings } = body as {
			zone_ids: string[];
			settings: Record<string, unknown>;
		};

		if (!zone_ids?.length) {
			return json({ error: 'zone_ids is required' }, { status: 400 });
		}

		if (!settings || Object.keys(settings).length === 0) {
			return json({ error: 'No settings provided' }, { status: 400 });
		}

		const results = await Promise.all(
			zone_ids.map(async (zoneId) => {
				const errors: string[] = [];

				for (const [name, value] of Object.entries(settings)) {
					try {
						await patchZoneSetting(zoneId, name, value);
					} catch (err) {
						errors.push(`${name}: ${err instanceof Error ? err.message : 'unknown error'}`);
					}
				}

				return {
					zoneId,
					success: errors.length === 0,
					error: errors.length > 0 ? errors.join('; ') : undefined
				};
			})
		);

		const successCount = results.filter((r) => r.success).length;

		return json({
			updated_count: successCount,
			total_requested: zone_ids.length,
			results
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unable to update settings';
		return json({ error: message }, { status: 500 });
	}
}
