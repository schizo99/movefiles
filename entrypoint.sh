#!/bin/sh
set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Create group only if the GID doesn't already exist
getent group "$PGID" > /dev/null 2>&1 || addgroup -g "$PGID" appgroup

# Create user only if the UID doesn't already exist
getent passwd "$PUID" > /dev/null 2>&1 || \
    adduser -u "$PUID" -G "$(getent group "$PGID" | cut -d: -f1)" -s /bin/sh -D appuser

chown -R "$PUID:$PGID" /app

exec su-exec "$PUID:$PGID" "$@"
