#!/bin/sh
set -eu

# Unique per-job Firefox profile root under /tmp. Nightly cannot use $RUNNER_TEMP
# on macOS, and a shared /tmp dir collides when several runners share a mini.
# Usage: firefox-tmp.sh allocate | cleanup

cmd=${1:?usage: firefox-tmp.sh allocate|cleanup}

case $cmd in
  allocate)
    id=$(printf '%s' "${GITHUB_RUN_ID:-0}-${GITHUB_JOB:-job}-${RUNNER_NAME:-local}" | tr -c 'A-Za-z0-9._-' '-')
    dir=$(mktemp -d "/tmp/haptic-ff-$id.XXXXXX")
    if [ -n "${GITHUB_ENV-}" ]; then
      echo "HAPTIC_FIREFOX_TMPDIR=$dir" >> "$GITHUB_ENV"
    fi
    echo "HAPTIC_FIREFOX_TMPDIR=$dir"
    ;;
  cleanup)
    dir=${HAPTIC_FIREFOX_TMPDIR-}
    [ -n "$dir" ] || exit 0
    case $dir in
      /tmp/haptic-ff-*) ;;
      *)
        echo "firefox-tmp.sh cleanup: refusing $dir" >&2
        exit 1
        ;;
    esac
    case $dir in
      *..*)
        echo "firefox-tmp.sh cleanup: refusing $dir" >&2
        exit 1
        ;;
    esac
    rm -rf "$dir"
    ;;
  *)
    echo "usage: firefox-tmp.sh allocate|cleanup" >&2
    exit 1
    ;;
esac
