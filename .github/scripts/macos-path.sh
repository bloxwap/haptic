#!/bin/sh
set -eu

# LaunchDaemon PATH often omits Homebrew. Later steps need gtar and zstd.
if [ -z "${GITHUB_PATH-}" ]; then
  echo "macos-path.sh requires GITHUB_PATH" >&2
  exit 1
fi
for prefix in /opt/homebrew /usr/local; do
  if [ -d "$prefix/bin" ]; then
    echo "$prefix/bin" >> "$GITHUB_PATH"
  fi
done
