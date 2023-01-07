#!/usr/bin/env bash

set -e

date=$(date +"%d.%m.%Y")

function copy {
  cp -R icons dist/icons
  cp manifest.json dist/
  cp options.html dist/
}

function script {
  for file in *.js; do
    ./node_modules/.bin/uglifyjs "$file" -c -m -o "dist/$file"
  done
}

function make_archive {
  # trick to zip without "dist" folder in archive
  # https://unix.stackexchange.com/a/182036
  cd dist
  zip -r "../gcal-checker-ext-$date.zip" *
  cd ../

  mv "gcal-checker-ext-$date.zip" dist-archives/
}

function clean {
  rm -rf dist
  mkdir dist
}

# Run tasks
clean
script
copy
make_archive

echo "Build complete!"
