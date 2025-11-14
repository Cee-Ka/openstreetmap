#!/usr/bin/env bash
set -euo pipefail

# Simple helper to install deps listed in npm-dependencies.txt and npm-dev-dependencies.txt
# Usage:
#   chmod +x install-deps.sh
#   ./install-deps.sh

cd "$(dirname "$0")"

if [ -f npm-dependencies.txt ]; then
  echo "Installing dependencies from npm-dependencies.txt..."
  # xargs will pass all lines as arguments to npm install
  xargs -a npm-dependencies.txt -r npm install
else
  echo "No npm-dependencies.txt found; skipping regular deps."
fi

if [ -f npm-dev-dependencies.txt ]; then
  echo "Installing devDependencies from npm-dev-dependencies.txt..."
  xargs -a npm-dev-dependencies.txt -r npm install -D
else
  echo "No npm-dev-dependencies.txt found; skipping dev deps."
fi

echo "Done."
