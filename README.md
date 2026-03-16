# RDT Client move file

A SvelteKit web app for moving files from an RDT Client download directory into categorised destination folders. Designed to be used from both desktop and mobile browsers.

## Configuration

The app is configured entirely via environment variables. Create a `.env` file in the project root (or pass them at runtime via Docker) with the following variables:

| Variable | Required | Description |
|---|---|---|
| `PUBLIC_SHARE` | Yes | Absolute path to the root share directory. The source folder is resolved as `$PUBLIC_SHARE/rdtclient` and destination folders are resolved as siblings of that root. |
| `PUBLIC_DEST_DIRS` | Yes | Comma-separated list of destination folder names (relative to `PUBLIC_SHARE`). Example: `UFC,F1,Movies` |
| `PUBLIC_DEST_DIR_PREFIX` | No | Subdirectory under `PUBLIC_SHARE` where destination folders live. Defaults to `tvshows`. |
| `PUBLIC_SOURCE_DIR_PREFIX` | No | Subdirectory under `PUBLIC_SHARE` used as the source folder. Defaults to `rdtclient`. |

### Example `.env`

```
PUBLIC_SHARE=/mnt/media
PUBLIC_DEST_DIRS=UFC,F1,Movies
```

With the above config:
- **Source** — `/mnt/media/rdtclient`
- **Destinations** — `/mnt/media/UFC`, `/mnt/media/F1`, `/mnt/media/Movies`

## Running with Docker

```bash
docker build -t rdt .
docker run -p 3000:3000 \
  -e PUBLIC_SHARE=/mnt/media \
  -e PUBLIC_DEST_DIRS=UFC,F1,Movies \
  -v /your/media:/mnt/media \
  rdt
```

## Development

```bash
pnpm install
pnpm dev
```

