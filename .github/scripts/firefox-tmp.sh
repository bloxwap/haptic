#!/bin/sh
set -eu

# Unique per-job Firefox profile root. Nightly cannot use $RUNNER_TEMP on macOS,
# a shared tmp dir collides when several runners share a mini, and /tmp is a
# symlink to /private/tmp that Nightly fails to resolve as a profile path.
# Usage: firefox-tmp.sh allocate | cleanup

cmd=${1:?usage: firefox-tmp.sh allocate|cleanup}

case $cmd in
  allocate)
    id=$(printf '%s' "${GITHUB_RUN_ID:-0}-${GITHUB_JOB:-job}-${RUNNER_NAME:-local}" | tr -c 'A-Za-z0-9._-' '-')
    root=/tmp
    if [ -d /private/tmp ]; then
      root=/private/tmp
    fi
    dir=$(mktemp -d "$root/haptic-ff-$id.XXXXXX")
    dir=$(cd "$dir" && pwd -P)
    if [ -n "${GITHUB_ENV-}" ]; then
      echo "HAPTIC_FIREFOX_TMPDIR=$dir" >> "$GITHUB_ENV"
    fi
    echo "HAPTIC_FIREFOX_TMPDIR=$dir"
    ;;
  cleanup)
    dir=${HAPTIC_FIREFOX_TMPDIR-}
    [ -n "$dir" ] || exit 0
    case $dir in
      /tmp/haptic-ff-*|/private/tmp/haptic-ff-*) ;;
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
