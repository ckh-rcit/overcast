<script lang="ts">
	import { onMount } from 'svelte';
	import type { ZoneWithSettings, UpdateResult, SettingConfig } from '$lib/types';
	import {
		ZONE_SETTINGS,
		CATEGORY_ORDER,
		CATEGORY_LABELS,
		getSettingById,
		getSettingsByCategory
	} from '$lib/settings';

	/* ── state ── */

	let zones = $state.raw<ZoneWithSettings[]>([]);
	let zonesLoading = $state(false);
	let selectedZones = $state(new Set<string>());

	let currentPage = $state(1);
	let zonesPerPage = $state(20);

	let settingValues = $state<Record<string, string | boolean>>({});
	let dirtySettings = $state(new Set<string>());

	let busy = $state(false);
	let toast = $state<{ type: 'ok' | 'error'; message: string } | null>(null);

	let showProgress = $state(false);
	let progressCurrent = $state(0);
	let progressTotal = $state(0);
	let progressMessage = $state('');
	let progressResults = $state<UpdateResult[]>([]);

	let showConfirmDialog = $state(false);

	/* ── derived ── */

	const totalPages = $derived(Math.max(1, Math.ceil(zones.length / zonesPerPage)));

	const pagedZones = $derived.by(() => {
		const start = (currentPage - 1) * zonesPerPage;
		return zones.slice(start, start + zonesPerPage);
	});

	const allPageSelected = $derived(
		pagedZones.length > 0 && pagedZones.every((z) => selectedZones.has(z.id))
	);

	const changedSettings = $derived.by(() => {
		const out: Record<string, unknown> = {};
		for (const id of dirtySettings) {
			const cfg = getSettingById(id);
			if (!cfg) continue;
			const val = settingValues[id];
			if (cfg.type === 'select' && val === '') continue;
			if (cfg.type === 'toggle') {
				out[id] = val;
			} else if (cfg.type === 'select') {
				const numericIds = ['browser_cache_ttl', 'challenge_ttl'];
				out[id] = numericIds.includes(id) ? parseInt(String(val)) : val;
			}
		}
		return out;
	});

	const canApply = $derived(selectedZones.size > 0 && Object.keys(changedSettings).length > 0);

	/* ── helpers ── */

	function flash(type: 'ok' | 'error', message: string) {
		toast = { type, message };
		setTimeout(() => (toast = null), 4500);
	}

	function formatSettingDisplay(settingId: string, value: unknown): string {
		if (value === undefined || value === null) return '—';
		const cfg = getSettingById(settingId);
		if (!cfg) return String(value);
		if (cfg.type === 'select' && cfg.options) {
			const opt = cfg.options.find((o) => String(o.value) === String(value));
			if (opt) return opt.label;
		}
		if (cfg.type === 'toggle') {
			return value === 'on' || value === true ? 'On' : 'Off';
		}
		return String(value);
	}

	function formatBrowserTTL(ttl: unknown): string {
		if (ttl === undefined || ttl === null) return '—';
		const num = Number(ttl);
		if (num === 0) return 'Respect Headers';
		const cfg = getSettingById('browser_cache_ttl');
		if (cfg?.options) {
			const opt = cfg.options.find((o) => Number(o.value) === num);
			if (opt) return opt.label;
		}
		const d = Math.floor(num / 86400);
		const h = Math.floor((num % 86400) / 3600);
		if (d > 0) return `${d}d`;
		if (h > 0) return `${h}h`;
		return `${num}s`;
	}

	/* ── API calls ── */

	async function loadZones() {
		zonesLoading = true;
		selectedZones = new Set();
		currentPage = 1;
		try {
			const res = await fetch('/api/zones');
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			zones = data.zones ?? [];
		} catch (err) {
			flash('error', `Failed to load zones: ${err instanceof Error ? err.message : 'unknown'}`);
		} finally {
			zonesLoading = false;
		}
	}

	async function applySettings() {
		showConfirmDialog = false;
		const ids = [...selectedZones];
		const settings = changedSettings;

		busy = true;
		showProgress = true;
		progressCurrent = 0;
		progressTotal = ids.length;
		progressMessage = 'Applying settings…';
		progressResults = [];

		try {
			const res = await fetch('/api/zones/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ zone_ids: ids, settings })
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);

			progressCurrent = ids.length;
			progressMessage = 'Complete';
			progressResults = (data.results ?? []).map((r: { zoneId: string; success: boolean; error?: string }) => ({
				...r,
				zoneName: zones.find((z) => z.id === r.zoneId)?.name ?? r.zoneId
			}));

			const ok = data.updated_count ?? 0;
			const fail = ids.length - ok;
			if (fail === 0) {
				flash('ok', `Applied ${Object.keys(settings).length} setting(s) to ${ok} zone(s)`);
			} else {
				flash('ok', `Applied to ${ok} zone(s). ${fail} failed.`);
			}

			resetForm();
			loadZones();
		} catch (err) {
			showProgress = false;
			flash('error', `Failed: ${err instanceof Error ? err.message : 'unknown'}`);
		} finally {
			busy = false;
		}
	}

	/* ── zone selection ── */

	function toggleZone(id: string) {
		const next = new Set(selectedZones);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedZones = next;
	}

	function toggleAllPage() {
		const next = new Set(selectedZones);
		if (allPageSelected) {
			for (const z of pagedZones) next.delete(z.id);
		} else {
			for (const z of pagedZones) next.add(z.id);
		}
		selectedZones = next;
	}

	/* ── settings form ── */

	function markDirty(id: string) {
		dirtySettings = new Set([...dirtySettings, id]);
	}

	function resetForm() {
		settingValues = {};
		dirtySettings = new Set();
	}

	function handleSelectChange(cfg: SettingConfig, value: string) {
		settingValues = { ...settingValues, [cfg.id]: value };
		markDirty(cfg.id);
	}

	function handleToggleChange(cfg: SettingConfig, checked: boolean) {
		settingValues = { ...settingValues, [cfg.id]: checked };
		markDirty(cfg.id);
	}

	/* ── lifecycle ── */

	onMount(() => {
		loadZones();
	});
</script>

<!-- ─── Toast ─── -->
{#if toast}
	<div class="toast">
		<div class="status {toast.type === 'ok' ? 'ok' : 'error'}">
			{toast.message}
		</div>
	</div>
{/if}

<!-- ─── Confirm Dialog ─── -->
{#if showConfirmDialog}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="dialog-backdrop" role="presentation" onclick={() => (showConfirmDialog = false)}>
		<div class="panel dialog" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()}>
			<div class="stack" style="gap: 0.65rem;">
				<p style="font-size: 0.82rem; font-weight: 600;">Confirm Batch Update</p>
				<p style="font-size: 0.76rem; color: var(--muted);">
					Apply <strong>{Object.keys(changedSettings).length}</strong> setting(s)
					to <strong>{selectedZones.size}</strong> zone(s)?
				</p>
				<div class="row" style="justify-content: flex-end; gap: 0.45rem;">
					<button class="button secondary" onclick={() => (showConfirmDialog = false)}>
						Cancel
					</button>
					<button class="button" onclick={applySettings}>
						Apply
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- ─── Progress Dialog ─── -->
{#if showProgress}
	<div class="dialog-backdrop" role="presentation">
		<div class="panel dialog" role="dialog">
			<div class="stack" style="gap: 0.6rem;">
				<p style="font-size: 0.82rem; font-weight: 600;">{progressMessage}</p>
				<div class="progress-bar-track">
					<div
						class="progress-bar-fill"
						style="width: {progressTotal > 0 ? (progressCurrent / progressTotal) * 100 : 0}%"
					></div>
				</div>
				<p class="muted">{progressCurrent} / {progressTotal}</p>
				{#if progressResults.length > 0}
					<div style="max-height: 200px; overflow-y: auto;">
						{#each progressResults as r}
							<div class="progress-item {r.success ? 'success' : 'error'}">
								<span>{r.success ? '✓' : '✗'}</span>
								<span>{r.zoneName}</span>
								{#if r.error}
									<span class="muted" style="margin-left: auto;">{r.error}</span>
								{/if}
							</div>
						{/each}
					</div>
					<div class="row" style="justify-content: flex-end;">
						<button class="button secondary" onclick={() => (showProgress = false)}>
							Dismiss
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- ─── Zones Panel ─── -->
<div class="panel">
	<div class="row" style="justify-content: space-between; margin-bottom: 0.5rem;">
		<span style="font-size: 0.82rem; font-weight: 600;">Zones</span>
		<div class="row" style="gap: 0.4rem;">
			{#if zones.length > 0}
				<span class="muted">
					{(currentPage - 1) * zonesPerPage + 1}–{Math.min(currentPage * zonesPerPage, zones.length)}
					of {zones.length}
				</span>
			{/if}
			<button class="button secondary" disabled={zonesLoading} onclick={loadZones}>
				{zonesLoading ? 'Loading…' : 'Refresh'}
			</button>
		</div>
	</div>

	{#if zonesLoading && zones.length === 0}
		<div class="stack" style="gap: 0.35rem;">
			{#each Array(5) as _}
				<div class="skeleton" style="height: 1.6rem; width: 100%;"></div>
			{/each}
		</div>
	{:else if zones.length === 0}
		<p class="muted" style="padding: 1rem 0; text-align: center;">
			No zones loaded. Click <strong>Refresh</strong> to fetch zones.
		</p>
	{:else}
		<div style="overflow-x: auto;">
			<table>
				<thead>
					<tr>
						<th style="width: 32px;">
							<input type="checkbox" checked={allPageSelected} onchange={toggleAllPage} />
						</th>
						<th>Zone</th>
						<th>Status</th>
						<th>Caching</th>
						<th>Browser TTL</th>
						<th>Dev Mode</th>
						<th>Min TLS</th>
						<th>HTTPS</th>
					</tr>
				</thead>
				<tbody>
					{#each pagedZones as zone (zone.id)}
						{@const selected = selectedZones.has(zone.id)}
						<tr style={selected ? 'background: oklch(0.18 0.02 230 / 0.3);' : ''}>
							<td>
								<input
									type="checkbox"
									checked={selected}
									onchange={() => toggleZone(zone.id)}
								/>
							</td>
							<td>{zone.name}</td>
							<td>
								<span class="badge {zone.status === 'active' ? 'badge-on' : 'badge-off'}">
									{zone.status}
								</span>
							</td>
							<td>{formatSettingDisplay('cache_level', zone.settings?.cache_level)}</td>
							<td>{formatBrowserTTL(zone.settings?.browser_cache_ttl)}</td>
							<td>
								{zone.settings?.development_mode === 'on' ? '✓ On' : 'Off'}
							</td>
							<td>{formatSettingDisplay('min_tls_version', zone.settings?.min_tls_version)}</td>
							<td>
								{zone.settings?.always_use_https === 'on' ? '✓' : '✗'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="row" style="justify-content: center; margin-top: 0.6rem; gap: 0.5rem;">
				<button
					class="button secondary"
					disabled={currentPage <= 1}
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
				>
					← Prev
				</button>
				<span class="muted">Page {currentPage} of {totalPages}</span>
				<button
					class="button secondary"
					disabled={currentPage >= totalPages}
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
				>
					Next →
				</button>
				<select
					class="select"
					style="width: auto; min-width: 5rem;"
					value={String(zonesPerPage)}
					onchange={(e) => {
						zonesPerPage = parseInt(e.currentTarget.value);
						currentPage = 1;
					}}
				>
					{#each [10, 20, 50, 100] as n}
						<option value={String(n)}>{n} / page</option>
					{/each}
				</select>
			</div>
		{/if}
	{/if}
</div>

<!-- ─── Batch Settings ─── -->
{#if selectedZones.size > 0}
	<div class="panel" style="margin-top: 0.65rem;">
		<div class="row" style="justify-content: space-between; margin-bottom: 0.6rem;">
			<span style="font-size: 0.82rem; font-weight: 600;">
				Batch Settings
			</span>
			<span class="muted">{selectedZones.size} zone{selectedZones.size !== 1 ? 's' : ''} selected</span>
		</div>

		{#each CATEGORY_ORDER as cat}
			{@const settings = getSettingsByCategory(cat)}
			{@const hasDirty = settings.some((s) => dirtySettings.has(s.id))}
			<div class="panel category-panel {hasDirty ? 'has-changes' : ''}" style="margin-bottom: 0.5rem;">
				<p class="category-heading">{CATEGORY_LABELS[cat]}</p>
				<div class="grid-2">
					{#each settings as cfg (cfg.id)}
						<div style="padding: 0.3rem 0;">
							<div class="setting-label">{cfg.label}</div>
							<div class="setting-desc">{cfg.description}</div>
							<div style="margin-top: 0.3rem;">
								{#if cfg.type === 'select' && cfg.options}
									<select
										class="select dirty-indicator {dirtySettings.has(cfg.id) ? 'dirty' : ''}"
										value={String(settingValues[cfg.id] ?? '')}
										onchange={(e) => handleSelectChange(cfg, e.currentTarget.value)}
									>
										<option value="">— No Change —</option>
										{#each cfg.options as opt}
											<option value={String(opt.value)}>{opt.label}</option>
										{/each}
									</select>
								{:else if cfg.type === 'toggle'}
									<label class="toggle">
										<input
											type="checkbox"
											checked={settingValues[cfg.id] === true}
											onchange={(e) => handleToggleChange(cfg, e.currentTarget.checked)}
										/>
										<span class="toggle-track"></span>
									</label>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}

		<div class="row" style="justify-content: flex-end; gap: 0.45rem; margin-top: 0.5rem;">
			<button class="button secondary" onclick={resetForm}>
				Reset
			</button>
			<button
				class="button save"
				disabled={!canApply || busy}
				onclick={() => (showConfirmDialog = true)}
			>
				Apply to {selectedZones.size} Zone{selectedZones.size !== 1 ? 's' : ''}
			</button>
		</div>
	</div>
{/if}
