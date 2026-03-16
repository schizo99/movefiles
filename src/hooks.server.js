import { env } from '$env/dynamic/public';

const REQUIRED = ['PUBLIC_SHARE', 'PUBLIC_DEST_DIRS'];

const missing = REQUIRED.filter((key) => !env[key]);
if (missing.length) {
	throw new Error(
		`Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`
	);
}
