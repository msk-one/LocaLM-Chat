#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Docker
if command_exists docker; then
    echo "Docker is already installed."
else
    echo "Docker is not installed. Downloading Docker Desktop for Mac..."
    DOCKER_URL="https://desktop.docker.com/mac/main/arm64/Docker.dmg"

    # Download Docker Desktop
    curl -L -o "/tmp/Docker.dmg" "$DOCKER_URL"
    
    echo "Docker Desktop has been downloaded to /tmp/Docker.dmg."
    
    # Mount the DMG
    sudo hdiutil attach /tmp/Docker.dmg
    
    sudo /Volumes/Docker/Docker.app/Contents/MacOS/install --accept-license

    # Unmount the DMG
    sudo hdiutil detach /Volumes/Docker
    
    exit 0
fi

docker desktop enable model-runner --tcp 12434
docker model pull ai/phi4:latest