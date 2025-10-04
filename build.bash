#!/bin/bash
files=(
  img/*
  lib/*
  src/index.html
  src/style.css
)

set -x
tsc
cp -t out "${files[@]}"
