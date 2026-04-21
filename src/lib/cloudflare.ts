import { env } from '$env/dynamic/private';
import type { ZoneWithSettings, ZoneSettings } from '$lib/types';

const API_BASE = 'https://api.cloudflare.com/client/v4';

interface CfResponse<T> {
	success: boolean;
	errors?: Array<{ message?: string }>;
	result: T;
	result_info?: {
		page: number;
		per_page: number;
		total_pages: number;
		total_count: number;
	};
}

function getHeaders(): HeadersInit {
	if (!env.CLOUDFLARE_API_TOKEN) {
		throw new Error('Missing CLOUDFLARE_API_TOKEN environment variable.');
	}
	return {
		Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
		'Content-Type': 'application/json'
	};
}

async function cfFetch<T>(path: string, init?: RequestInit): Promise<CfResponse<T>> {
	const response = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: {
			...getHeaders(),
			...(init?.headers ?? {})
		}
	});

	const data = (await response.json()) as CfResponse<T>;

	if (!response.ok || !data.success) {
		const detail =
			data.errors?.map((e) => e.message).filter(Boolean).join('; ') || 'Cloudflare API error';
		throw new Error(detail);
	}

	return data;
}

export async function listZones(): Promise<ZoneWithSettings[]> {
	let page = 1;
	let totalPages = 1;
	const rawZones: Array<{ id: string; name: string; status: string }> = [];

	do {
		const data = await cfFetch<Array<{ id: string; name: string; status: string }>>(
			`/zones?per_page=100&page=${page}`
		);
		rawZones.push(...data.result);
		totalPages = data.result_info?.total_pages ?? 1;
		page += 1;
	} while (page <= totalPages);

	rawZones.sort((a, b) => a.name.localeCompare(b.name));

	const zonesWithSettings = await Promise.all(
		rawZones.map(async (zone) => {
			const settings = await fetchZoneSettings(zone.id);
			return { id: zone.id, name: zone.name, status: zone.status, settings };
		})
	);

	return zonesWithSettings;
}

async function fetchZoneSettings(zoneId: string): Promise<ZoneSettings> {
	try {
		const data = await cfFetch<Array<{ id: string; value: unknown }>>(
			`/zones/${zoneId}/settings`
		);

		const settings: ZoneSettings = {};
		for (const s of data.result) {
			if (s.id === 'browser_cache_ttl') {
				settings[s.id] = parseInt(String(s.value)) || 0;
			} else {
				settings[s.id] = s.value as string | number | boolean | Record<string, unknown>;
			}
		}
		return settings;
	} catch {
		return {};
	}
}

export async function patchZoneSetting(
	zoneId: string,
	settingName: string,
	value: unknown
): Promise<void> {
	let apiValue: unknown;

	if (typeof value === 'boolean') {
		apiValue = value ? 'on' : 'off';
	} else {
		apiValue = value;
	}

	await cfFetch(`/zones/${zoneId}/settings/${settingName}`, {
		method: 'PATCH',
		body: JSON.stringify({ value: apiValue })
	});
}
