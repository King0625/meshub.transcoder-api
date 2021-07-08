#!/bin/bash
# rm /var/www/torii-demo.meshub.io/*.mp4
#cp /home/meshdev/torii-demo-input.mp4 /var/www/torii-demo.meshub.io/v2/test.mp4
ffmpeg -y -f concat -safe 0 -i <(find "$2" -maxdepth 1 -name "$1-*.mp4" -printf "file '%p'\n" | sort) -c copy -movflags +faststart /var/www/torii-demo.meshub.io/v2/result/$3
