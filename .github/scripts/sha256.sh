#!/bin/sh
set -eu

# Portable SHA-256 digest/verify: GNU on Linux, shasum on macOS.
# Usage:
#   sha256.sh digest <output> <file> [<file> ...]
#   sha256.sh verify <sumfile>

cmd=${1:?usage: sha256.sh digest|verify ...}
shift

case $cmd in
  digest)
    out=${1:?}
    shift
    if [ "$#" -eq 0 ]; then
      echo "sha256.sh digest: no files" >&2
      exit 1
    fi
    for file in "$@"; do
      if [ ! -f "$file" ]; then
        echo "sha256.sh digest: missing file $file" >&2
        exit 1
      fi
    done
    if command -v sha256sum >/dev/null 2>&1; then
      sha256sum "$@" > "$out"
    else
      shasum -a 256 "$@" > "$out"
    fi
    ;;
  verify)
    if command -v sha256sum >/dev/null 2>&1; then
      sha256sum -c "${1:?}"
    else
      shasum -a 256 -c "${1:?}"
    fi
    ;;
  *)
    echo "usage: sha256.sh digest|verify ..." >&2
    exit 1
    ;;
esac
