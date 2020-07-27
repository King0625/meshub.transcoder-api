#!/bin/bash
ffmpeg -y -f concat -safe 0 -i <(find ./routes -maxdepth 1 -name '*.mp4' -printf "file '$PWD/%p'\n" | sort) -c copy /var/www/torii-demo.meshub.io/$1
