import { env } from '$env/dynamic/public';

const REQUIRED: string[] = ['PUBLIC_SHARE', 'PUBLIC_DEST_DIRS'];

const missing = REQUIRED.filter((key) => !env[key as `PUBLIC_${string}`]);
if (missing.length) {
	process.stderr.write(
		[
			'',
			'ERROR: Missing required environment variable' + (missing.length > 1 ? 's' : ''),
			'',
			...missing.map((key) => `  - ${key}`),
			'',
			'Set them when starting the container, for example:',
			'',
			`  docker run -e PUBLIC_SHARE=/mnt/share -e PUBLIC_DEST_DIRS=/mnt/dest your-image`,
			'',
		].join('\n') + '\n'
	);
	process.exit(1);
}
