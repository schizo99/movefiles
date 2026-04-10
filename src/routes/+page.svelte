<script lang="ts">
	import { listFiles, destDirectories, listDir, moveFiles, deleteSourceEntries } from '$lib/data.remote';
	import type { FileEntry } from '$lib/data.remote';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import FilePanel from '$lib/FilePanel.svelte';

	let files = $state<FileEntry[]>([]);
	let destDirs = $state<{ name: string }[]>([]);
	let currentPath = $state('');
	let selectedNames = $state<string[]>([]);
	let destDir = $state('');
	let moving = $state(false);
	let deleting = $state(false);
	let showDeleteModal = $state(false);
	let refreshing = false;

	const sortEntries = (entries: FileEntry[]): FileEntry[] => {
		return [...entries].sort((a, b) => {
			if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
			return a.name.localeCompare(b.name);
		});
	};

	const sameEntries = (a: FileEntry[], b: FileEntry[]): boolean => {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i += 1) {
			if (
				a[i].name !== b[i].name ||
				a[i].isFile !== b[i].isFile ||
				a[i].isDirectory !== b[i].isDirectory
			) {
				return false;
			}
		}
		return true;
	};

	const refresh = async (): Promise<void> => {
		if (refreshing) return;
		refreshing = true;
		try {
			const nonce = Date.now();
			const nextFiles = sortEntries(
				await (currentPath ? listDir({ dirpath: currentPath, nonce }) : listFiles(nonce))
			);
			if (!sameEntries(files, nextFiles)) {
				files = nextFiles;
			}
		} finally {
			refreshing = false;
		}
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
		if (!selectedNames.length || !destDir) return;
		moving = true;
		try {
			await moveFiles({ files: selectedNames, dest: destDir, dirpath: currentPath });
			selectedNames = [];
			destDir = '';
			await refresh();
		} finally {
			moving = false;
		}
	};

	const openDeleteModal = (): void => {
		if (!selectedNames.length) return;
		showDeleteModal = true;
	};

	const confirmDelete = async (): Promise<void> => {
		if (!selectedNames.length) {
			showDeleteModal = false;
			return;
		}
		deleting = true;
		try {
			await deleteSourceEntries({ entries: selectedNames, dirpath: currentPath });
			selectedNames = [];
			showDeleteModal = false;
			await refresh();
		} finally {
			deleting = false;
		}
	};

	const cancelDelete = (): void => {
		if (deleting) return;
		showDeleteModal = false;
	};
	const updateFiles = (file: { name: string; isDirectory?: boolean }): void => {
		if (file.isDirectory) {
			currentPath = currentPath ? `${currentPath}/${file.name}` : file.name;
			selectedNames = [];
			void refresh();
		}
	};
	const navigateUp = (): void => {
		const parts = currentPath.split('/').slice(0, -1);
		currentPath = parts.join('/');
		selectedNames = [];
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
		showCheckbox={true}
		isSelected={(file) => selectedNames.includes(file.name)}
		isCheckboxChecked={(file) => selectedNames.includes(file.name)}
		onSelectionToggle={(file, checked) => {
			if (checked) {
				if (!selectedNames.includes(file.name)) selectedNames = [...selectedNames, file.name];
			} else {
				selectedNames = selectedNames.filter((f) => f !== file.name);
			}
		}}
		onItemClick={(file) => {
			if (selectedNames.includes(file.name)) {
				selectedNames = selectedNames.filter((f) => f !== file.name);
			} else {
				selectedNames = [...selectedNames, file.name];
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
		class="mr-2 rounded bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-40"
		disabled={selectedNames.length === 0 || moving || deleting}
		onclick={openDeleteModal}
	>
		Delete
	</button>
	<button
		class="rounded bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
		disabled={selectedNames.length === 0 || deleting || moving || !destDir}
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

{#if showDeleteModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h2 class="text-lg font-semibold text-gray-900">Delete source entries?</h2>
			<p class="mt-2 text-sm text-gray-700">
				This will permanently delete {selectedNames.length} selected source
				{selectedNames.length === 1 ? ' item' : ' items'}.
			</p>
			<div class="mt-5 flex justify-end gap-2">
				<button
					class="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
					disabled={deleting}
					onclick={cancelDelete}
				>
					No
				</button>
				<button
					class="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
					disabled={deleting}
					onclick={confirmDelete}
				>
					Yes, delete
				</button>
			</div>
		</div>
	</div>
{/if}
