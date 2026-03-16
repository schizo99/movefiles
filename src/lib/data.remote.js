import { query } from '$app/server';
import { env } from '$env/dynamic/public';
import * as v from 'valibot';

const BASE_DIR = env.PUBLIC_SHARE;
const SOURCE_DIR = `${BASE_DIR}/${env.PUBLIC_SOURCE_DIR_PREFIX ?? 'rdtclient'}`;
const DEST_DIR = `${BASE_DIR}/${env.PUBLIC_DEST_DIR_PREFIX ?? 'tvshows'}`;
async function listFilesInDirectory(dirPath) {
	try {
		const fs = await import('fs');
		const path = await import('path');
		const items = fs.readdirSync(dirPath);
		const filesAndDirs = items.map((item) => {
			const fullPath = path.join(dirPath, item);
			const stats = fs.statSync(fullPath);
			return { name: item, isFile: stats.isFile(), isDirectory: stats.isDirectory() };
		});
		return filesAndDirs;
	} catch (error) {
		console.error(`Error reading directory: ${error.message}`);
		return [];
	}
}
export const listDir = query(v.string(), async (dirpath) => {
	const files = await listFilesInDirectory(`${DEST_DIR}/${dirpath}`);
	console.log(`Listed directory: ${dirpath}, found ${files.length} items`);
	return files;
});

export const listFiles = query(async () => {
	const files = await listFilesInDirectory(SOURCE_DIR);
	return files.sort((a, b) => {
		if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
});

export const destDirectories = query(() => {
	return (env.PUBLIC_DEST_DIRS ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
		.map((name) => ({ name }));
});

export const moveFiles = query(
	v.object({ files: v.array(v.string()), dest: v.string() }),
	async ({ files, dest }) => {
		const fs = await import('fs');
		const path = await import('path');
		const srcBase = BASE_DIR;
		const destBase = path.join(BASE_DIR, '..', dest);
		for (const file of files) {
			const srcPath = path.join(srcBase, file);
			const destPath = path.join(destBase, file);
			fs.copyFileSync(srcPath, destPath);
			fs.unlinkSync(srcPath);
		}
		return { moved: files.length };
	}
);
