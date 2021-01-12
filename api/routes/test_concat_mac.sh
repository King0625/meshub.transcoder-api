#!/bin/bash
ffmpeg -y -f concat -safe 0 -i <(gfind ./routes -maxdepth 1 -name '*.mp4' -printf "file '$PWD/%p'\n" | sort) -c copy -movflags +faststart /tmp/result.mp4
