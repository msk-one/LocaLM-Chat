#!/bin/bash

# Build the Vue app if dist directory doesn't exist
if [ ! -d "dist" ]; then
  npm run build
fi

# Run Electron with explicit entry point
npx electron electron/main.js