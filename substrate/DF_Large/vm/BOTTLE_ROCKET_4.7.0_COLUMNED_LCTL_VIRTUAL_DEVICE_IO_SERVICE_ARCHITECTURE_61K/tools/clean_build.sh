#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-0}"
make clean
make all
make image
