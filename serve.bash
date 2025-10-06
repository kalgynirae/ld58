#!/bin/bash

if ! mkdir -vp out; then
  echo "mkdir failed" 2>&1
  exit 1
fi
rm out/*

trap 'kill %1 %2' EXIT
python3 -m http.server -d out/ |& grep -v '\<HEAD\>' &
tsc -w |& sed 's/\o033\[2J\o033\[3J\o033\[H//g' &

while sleep 0.1; do
  files=(
    audio/*
    font/*
    img/*
    lib/*
    src/index.html
    src/style.css
  )
  cp -vt out "${files[@]}"
  if ! inotifywait -e close_write -rq src/; then
    echo "inotifywait failed" 2>&1
    exit 1
  fi
done
