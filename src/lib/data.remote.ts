import { query } from '$app/server';
import { env } from '$env/dynamic/public';
import * as v from 'valibot';
import fs from 'fs';
import path from 'path';

// env vars are validated in hooks.server.ts before the app starts
function getSourceDir(): string {
	return path.join(env.PUBLIC_SHARE as string, env.PUBLIC_SOURCE_DIR_PREFIX ?? 'rdtclient');
}

function getDestDir(): string {
	return path.join(env.PUBLIC_SHARE as string, env.PUBLIC_DEST_DIR_PREFIX ?? 'tvshows');
}

function resolveWithinBase(base: string, target: string): string {
	const resolvedBase = path.resolve(base);
	const resolvedTarget = path.resolve(base, target);
	if (resolvedTarget !== resolvedBase && !resolvedTarget.startsWith(`${resolvedBase}${path.sep}`)) {
		throw new Error(`Path escapes base directory: ${target}`);
	}
	return resolvedTarget;
}

export interface FileEntry {
	name: string;
	isFile: boolean;
	isDirectory: boolean;
}

function listFilesInDirectory(dirPath: string): FileEntry[] {
	try {
		const items = fs.readdirSync(dirPath);
		return items.map((item) => {
			const fullPath = path.join(dirPath, item);
			const stats = fs.statSync(fullPath);
			return { name: item, isFile: stats.isFile(), isDirectory: stats.isDirectory() };
		});
	} catch (error) {
		console.error(`Error reading directory: ${error instanceof Error ? error.message : String(error)}`);
		return [];
	}
}

function copyFileWithProgress(
	srcPath: string,
	destPath: string,
	onChunkCopied: (chunkBytes: number) => void
): void {
	const srcFd = fs.openSync(srcPath, 'r');
	const destFd = fs.openSync(destPath, 'w');
	const buffer = Buffer.allocUnsafe(8 * 1024 * 1024);

	try {
		while (true) {
			const bytesRead = fs.readSync(srcFd, buffer, 0, buffer.length, null);
			if (bytesRead === 0) break;
			fs.writeSync(destFd, buffer, 0, bytesRead);
			onChunkCopied(bytesRead);
		}
	} finally {
		fs.closeSync(srcFd);
		fs.closeSync(destFd);
	}
}

function getDirectorySizeBytes(dirPath: string): number {
	let total = 0;
	for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			total += getDirectorySizeBytes(fullPath);
		} else if (entry.isFile()) {
			total += fs.statSync(fullPath).size;
		}
	}
	return total;
}

function copyEntryWithProgress(
	srcPath: string,
	destPath: string,
	onChunkCopied: (chunkBytes: number) => void
): void {
	const stats = fs.lstatSync(srcPath);
	if (stats.isDirectory()) {
		fs.mkdirSync(destPath, { recursive: true });
		for (const entry of fs.readdirSync(srcPath)) {
			copyEntryWithProgress(path.join(srcPath, entry), path.join(destPath, entry), onChunkCopied);
		}
		return;
	}
	if (stats.isFile()) {
		copyFileWithProgress(srcPath, destPath, onChunkCopied);
		return;
	}
	throw new Error(`Unsupported entry type for move: ${srcPath}`);
}

function getEntrySizeBytes(srcPath: string): number {
	const stats = fs.lstatSync(srcPath);
	if (stats.isDirectory()) return getDirectorySizeBytes(srcPath);
	if (stats.isFile()) return stats.size;
	throw new Error(`Unsupported entry type for size calculation: ${srcPath}`);
}

export const listDir = query(
	v.object({ dirpath: v.string(), nonce: v.optional(v.number()) }),
	({ dirpath }: { dirpath: string; nonce?: number }): FileEntry[] => {
	const fullPath = path.join(getSourceDir(), dirpath);
	console.log(`[listDir] scanning: ${fullPath}`);
	const files = listFilesInDirectory(fullPath);
	console.log(`[listDir] Listed directory: ${dirpath}, found ${files.length} items`);
	return files;
}
);

export const listFiles = query(v.optional(v.number()), (_nonce?: number): FileEntry[] => {
	return listFilesInDirectory(getSourceDir()).sort((a, b) => {
		if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
});

export const destDirectories = query((): { name: string }[] => {
	return (env.PUBLIC_DEST_DIRS ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
		.map((name) => ({ name }));
});

export const moveFiles = query(
	v.object({ files: v.array(v.string()), dest: v.string(), dirpath: v.optional(v.string()) }),
	({ files, dest, dirpath }: { files: string[]; dest: string; dirpath?: string }): { moved: number } => {
		const srcBase = resolveWithinBase(getSourceDir(), dirpath ?? '');
		const destBase = path.join(getDestDir(), dest);
		const progressLogStepBytes = 75 * 1024 * 1024;
		let totalBytes = 0;
		for (const file of files) {
			const srcPath = resolveWithinBase(srcBase, file);
			totalBytes += getEntrySizeBytes(srcPath);
		}

		console.log(
			`[moveFiles] start total=${files.length} files bytes=${totalBytes} from=${srcBase} to=${destBase}`
		);

		fs.mkdirSync(destBase, { recursive: true });
		let movedBytes = 0;
		let nextProgressLogAt = progressLogStepBytes;
		for (const [index, file] of files.entries()) {
			const srcPath = resolveWithinBase(srcBase, file);
			const destPath = resolveWithinBase(destBase, file);
			copyEntryWithProgress(srcPath, destPath, (chunkBytes: number) => {
				movedBytes += chunkBytes;
				while (movedBytes >= nextProgressLogAt && nextProgressLogAt <= totalBytes) {
					console.log(
						`[moveFiles] progress ${movedBytes}/${totalBytes} bytes moved files_started=${index + 1}/${files.length}`
					);
					nextProgressLogAt += progressLogStepBytes;
				}
			});
			fs.rmSync(srcPath, { recursive: true, force: true });
			console.log(
				`[moveFiles] file_done ${index + 1}/${files.length} ${movedBytes}/${totalBytes} bytes file=${file}`
			);
		}
		console.log(`[moveFiles] done moved=${files.length} files bytes=${movedBytes}`);
		return { moved: files.length };
	}
);

export const deleteSourceEntries = query(
	v.object({ entries: v.array(v.string()), dirpath: v.optional(v.string()) }),
	({ entries, dirpath }: { entries: string[]; dirpath?: string }): { deleted: number } => {
		const srcBase = resolveWithinBase(getSourceDir(), dirpath ?? '');
		let deleted = 0;
		for (const entry of entries) {
			const targetPath = resolveWithinBase(srcBase, entry);
			if (!fs.existsSync(targetPath)) {
				continue;
			}
			const stats = fs.lstatSync(targetPath);
			if (stats.isDirectory()) {
				fs.rmSync(targetPath, { recursive: true, force: true });
			} else {
				fs.unlinkSync(targetPath);
			}
			deleted += 1;
		}
		console.log(`[deleteSourceEntries] done deleted=${deleted} base=${srcBase}`);
		return { deleted };
	}
);
