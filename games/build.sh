#!/bin/sh
# Builds each game into dist/<game>/index.html (+ zip for upload to game portals)
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/preview
for f in src/*.html; do
  name=$(basename "$f" .html)
  body=$(python3 -c "import sys;s=open(sys.argv[1]).read();print(s.replace('/*@COMMON@*/',open('src/common.js').read()))" "$f")
  printf '%s\n' "$body" > "dist/preview/$name.html"
  mkdir -p "dist/$name"
  { echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
    echo '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
    printf '%s\n' "$body"
    echo '</html>'; } > "dist/$name/index.html"
  (cd "dist/$name" && zip -q "../$name.zip" index.html)
done
ls -la dist
