#!/bin/bash

rm out/*

trap 'kill %1' EXIT
python3 -m http.server -d out/ |& grep -v '\<HEAD\>' &

while true; do
  ./build.bash
  inotifywait -e close_write -rq src/
done
