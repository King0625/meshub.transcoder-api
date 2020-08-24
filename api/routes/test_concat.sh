#!/bin/bash
rm /var/www/torii-demo.meshub.io/*.mp4
cp /home/meshdev/torii-demo-input.mp4 /var/www/torii-demo.meshub.io/test.mp4
ffmpeg -y -f concat -safe 0 -i <(find ./routes -maxdepth 1 -name '*.mp4' -printf "file '$PWD/%p'\n" | sort) -c copy /var/www/torii-demo.meshub.io/$1
