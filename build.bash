#!/bin/bash
set -x
rm out/*
tsc
cp -t out src/style.css
cp -t out src/index.html
