<script lang="ts">
	import { listFiles, destDirectories, listDir, moveFiles } from '$lib/data.remote';
	import type { FileEntry } from '$lib/data.remote';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import FilePanel from '$lib/FilePanel.svelte';

	let files = $state<FileEntry[]>([]);
	let destDirs = $state<{ name: string }[]>([]);
	let currentPath = $state('');
	let sourceFiles = $state<string[]>([]);
	let destDir = $state('');
	let moving = $state(false);

	const refresh = async (): Promise<void> => {
		files = await (currentPath ? listDir(currentPath) : listFiles());
	};

	let interval: ReturnType<typeof setInterval> | undefined;
	const onFocus = (): void => { void refresh(); };
	onMount(() => {
		if (!browser) return;
		void refresh();
		void destDirectories().then((d) => (destDirs = d));
		interval = setInterval(() => { void refresh(); }, 1000);
		window.addEventListener('focus', onFocus);
	});
	onDestroy(() => {
		if (!browser) return;
		clearInterval(interval);
		window.removeEventListener('focus', onFocus);
	});
	const handleMove = async (): Promise<void> => {
		if (!sourceFiles.length || !destDir) return;
		moving = true;
		try {
			await moveFiles({ files: sourceFiles, dest: destDir });
			void refresh();
			sourceFiles = [];
			destDir = '';
		} finally {
			moving = false;
		}
	};
	const updateFiles = (file: { name: string; isDirectory?: boolean }): void => {
		if (file.isDirectory) {
			currentPath = currentPath ? `${currentPath}/${file.name}` : file.name;
			sourceFiles = [];
			void refresh();
		}
	};
	const navigateUp = (): void => {
		const parts = currentPath.split('/').slice(0, -1);
		currentPath = parts.join('/');
		sourceFiles = [];
		void refresh();
	};
</script>

<div style="text-align: center;">
	<h1 class="text-4xl font-bold">RDT Move</h1>
</div>

<div class="mt-6 mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row">
	<FilePanel
		title="Source"
		{files}
		isSelected={(file) => sourceFiles.includes(file.name)}
		onItemClick={(file) => {
			if (sourceFiles.includes(file.name)) {
				sourceFiles = sourceFiles.filter((f) => f !== file.name);
			} else {
				sourceFiles.push(file.name);
			}
		}}
		onItemDblClick={updateFiles}
		onNavigateUp={currentPath ? navigateUp : undefined}
	/>
	<FilePanel
		title="Destination"
		files={destDirs}
		isSelected={(file) => destDir === file.name}
		hoverClass="hover:bg-green-100"
		selectedClass="bg-green-200"
		onItemClick={(file) => (destDir = file.name)}
	/>
</div>

<div class="mt-4 flex justify-center">
	<button
		class="rounded bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
		disabled={sourceFiles.length === 0 || !destDir}
		onclick={handleMove}
	>
		Move
	</button>
</div>

{#if moving}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="flex flex-col items-center gap-3 rounded-lg bg-white px-10 py-8 shadow-xl">
			<svg class="h-10 w-10 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
			</svg>
			<span class="text-sm font-medium text-gray-700">Moving files…</span>
		</div>
	</div>
{/if}
