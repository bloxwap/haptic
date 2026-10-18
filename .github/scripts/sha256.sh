#!/bin/sh
set -eu

# BSD-portable SHA-256 digest/verify. Avoids GNU sha256sum.
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
    shasum -a 256 "$@" > "$out"
    ;;
  verify)
    shasum -a 256 -c "${1:?}"
    ;;
  *)
    echo "usage: sha256.sh digest|verify ..." >&2
    exit 1
    ;;
esac
