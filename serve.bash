#!/bin/bash

if ! mkdir -vp out; then
  exit 1
fi
rm out/*

trap 'kill %1' EXIT
trap 'kill %2' EXIT
python3 -m http.server -d out/ |& grep -v '\<HEAD\>' &
tsc -w &

while true; do
  files=(
    img/*
    lib/*
    src/index.html
    src/style.css
  )
  cp -vt out "${files[@]}"
  inotifywait -e close_write -rq src/
done
