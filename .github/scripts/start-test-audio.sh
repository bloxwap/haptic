#!/bin/sh
set -eu

# Browser WebAudio tests need a reachable output device.
# Mac mini runners already have Core Audio; do not install packages.
if [ -n "${GITHUB_ACTIONS-}" ]; then
  tmpdir=${RUNNER_TEMP:?RUNNER_TEMP is required in GitHub Actions}
else
  tmpdir=${RUNNER_TEMP:-${TMPDIR:-/tmp}}
fi

mkdir -p "$tmpdir"
report=$tmpdir/core-audio.txt

os=$(uname -s)
if [ "$os" != Darwin ]; then
  echo "start-test-audio.sh supports macOS runners only (got $os)." >&2
  echo "See docs/ci-runners.md." >&2
  exit 1
fi

if ! command -v system_profiler >/dev/null 2>&1; then
  echo "system_profiler is required to confirm Core Audio output." >&2
  exit 1
fi

system_profiler SPAudioDataType -detailLevel mini > "$report"
if ! grep -q "Output" "$report"; then
  echo "No Core Audio output device reported. Browser WebAudio tests need a reachable output." >&2
  cat "$report" >&2
  exit 1
fi

echo "Core Audio output is available for browser WebAudio tests."
