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
export const listDir = query(v.string(), (dirpath: string): FileEntry[] => {
	const fullPath = path.join(getSourceDir(), dirpath);
	console.log(`[listDir] scanning: ${fullPath}`);
	const files = listFilesInDirectory(fullPath);
	console.log(`[listDir] Listed directory: ${dirpath}, found ${files.length} items`);
	return files;
});

export const listFiles = query((): FileEntry[] => {
	console.log(`Listing source directory: ${getSourceDir()}`);
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
		const srcBase = path.join(getSourceDir(), dirpath ?? '');
		const destBase = path.join(getDestDir(), dest);
		fs.mkdirSync(destBase, { recursive: true });
		for (const file of files) {
			const srcPath = path.join(srcBase, file);
			const destPath = path.join(destBase, file);
			fs.copyFileSync(srcPath, destPath);
			fs.unlinkSync(srcPath);
		}
		return { moved: files.length };
	}
);
