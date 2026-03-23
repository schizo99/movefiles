<script lang="ts">
	interface FileItem {
		name: string;
		isFile?: boolean;
		isDirectory?: boolean;
	}

	interface Props {
		title: string;
		files: FileItem[];
		isSelected?: (file: FileItem) => boolean;
		isCheckboxChecked?: (file: FileItem) => boolean;
		showCheckbox?: boolean;
		onSelectionToggle?: (file: FileItem, checked: boolean) => void;
		hoverClass?: string;
		selectedClass?: string;
		onItemClick?: (file: FileItem) => void;
		onItemDblClick?: (file: FileItem) => void;
		onNavigateUp?: () => void;
	}

	let {
		title,
		files,
		isSelected = () => false,
		isCheckboxChecked = isSelected,
		showCheckbox = false,
		onSelectionToggle,
		hoverClass = 'hover:bg-blue-300',
		selectedClass = 'bg-blue-200',
		onItemClick,
		onItemDblClick,
		onNavigateUp
	}: Props = $props();

	const handleRowClick = (file: FileItem): void => {
		if (showCheckbox && file.isDirectory && onItemDblClick) {
			onItemDblClick(file);
			return;
		}
		onItemClick?.(file);
	};

	const isRowClickable = (file: FileItem): boolean => {
		return Boolean(onItemClick || (showCheckbox && file.isDirectory && onItemDblClick));
	};
</script>

<div class="w-full overflow-hidden rounded border-2 border-gray-400 shadow-md">
	<div class="flex items-center gap-2 border-b border-gray-400 bg-gray-200 px-3 py-1">
		<span class="inline-block h-3 w-3 rounded-full bg-red-400"></span>
		<span class="inline-block h-3 w-3 rounded-full bg-yellow-400"></span>
		<span class="inline-block h-3 w-3 rounded-full bg-green-400"></span>
		<span class="ml-2 text-sm font-medium text-gray-600">{title}</span>
	</div>
	<ul class="min-h-32 bg-white p-2">
		{#if onNavigateUp}
			<li
				role="option"
				aria-selected="false"
				class={`flex items-center cursor-pointer rounded px-2 py-3 font-bold ${hoverClass}`}
				onclick={onNavigateUp}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateUp(); }}
			>..</li>
		{/if}
		{#each files as file (file.name)}
			<li
				role="option"
				aria-selected={isSelected(file)}
				class={`flex items-center justify-between rounded px-2 py-3 ${isRowClickable(file) ? 'cursor-pointer' : ''} ${hoverClass} ${file.isDirectory ? 'font-bold' : ''} ${isSelected(file) ? selectedClass : ''}`}
				onclick={() => handleRowClick(file)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') handleRowClick(file);
				}}
			>
				<div class="flex items-center gap-2">
					{#if showCheckbox}
						<input
							type="checkbox"
							checked={isCheckboxChecked(file)}
							aria-label={`Select ${file.name}`}
							onclick={(e) => e.stopPropagation()}
							onchange={(e) =>
								onSelectionToggle?.(file, (e.currentTarget as HTMLInputElement).checked)}
						/>
					{/if}
					{#if showCheckbox && file.isDirectory}
						<button
							type="button"
							class="text-left"
							onclick={(e) => {
								e.stopPropagation();
								onItemClick?.(file);
							}}
						>{file.name}</button>
					{:else}
						<span>{file.name}</span>
					{/if}
				</div>
				{#if file.isDirectory && onItemDblClick}
					<button
						class="ml-2 px-2 py-1 text-gray-500 hover:text-gray-800"
						aria-label="Open {file.name}"
						onclick={(e) => { e.stopPropagation(); onItemDblClick(file); }}
					>›</button>
				{/if}
			</li>
		{/each}
	</ul>
</div>
