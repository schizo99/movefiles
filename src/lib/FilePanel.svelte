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
				class={`flex items-center justify-between rounded px-2 py-3 ${hoverClass} ${file.isDirectory ? 'font-bold' : ''} ${isSelected(file) ? selectedClass : ''}`}
			>
				<div
					role="option"
					aria-selected={isSelected(file)}
					tabindex={onItemClick ? 0 : -1}
					class={`flex flex-1 min-w-0 items-center gap-2 ${onItemClick ? 'cursor-pointer' : ''}`}
					onclick={() => onItemClick?.(file)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') onItemClick?.(file);
					}}
				>
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
					<span class="truncate">{file.name}</span>
				</div>
				{#if file.isDirectory && onItemDblClick}
					<button
						class="ml-2 px-2 py-1 text-gray-500 hover:text-gray-800"
						aria-label="Open {file.name}"
						onclick={() => onItemDblClick(file)}
					>›</button>
				{/if}
			</li>
		{/each}
	</ul>
</div>
