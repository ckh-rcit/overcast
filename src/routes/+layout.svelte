<script lang="ts">
	import './layout.css';

	let { children } = $props();
	const currentYear = new Date().getFullYear();

	function resetToHome(event: MouseEvent): void {
		event.preventDefault();
		window.location.assign('/');
	}
</script>

<svelte:head>
	<title>OVERCAST — Zone Settings</title>
	<meta
		name="description"
		content="Batch manage Cloudflare zone settings across multiple zones from a single UI."
	/>
</svelte:head>

<div class="app-shell">
	<header class="app-header">
		<div class="brand-block">
			<h1><a href="/" onclick={resetToHome}>OVERCAST</a></h1>
			<span class="brand-kicker">Cloudflare Zone Settings Manager</span>
		</div>
	</header>

	<main>
		{@render children()}
	</main>

	<footer class="muted" style="margin-top: 0.7rem; text-align: center;">
		&copy; {currentYear} Chris K. Harris ·
		<a href="https://github.com/ckh-rcit/overcast" target="_blank" rel="noreferrer">GitHub</a>
	</footer>
</div>
