#!/bin/bash

chmod -R u=rwX,go=rX out
rsync "$@" --itemize-changes --recursive --perms --delete out/ lemon.lumeh.org:/srv/http/lumeh.org/games/trash/
