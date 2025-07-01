# Check if Docker is installed
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Docker is already installed."
} else {
    Write-Host "Docker is not installed. Downloading Docker Desktop for Windows..."
    $DOCKER_URL = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $INSTALLER_PATH = "$env:TEMP\DockerInstaller.exe"

    # Download Docker Desktop
    Invoke-WebRequest -Uri $DOCKER_URL -OutFile $INSTALLER_PATH

    # Run the installer
    Start-Process -FilePath $INSTALLER_PATH -ArgumentList "install --quiet --accept-license" -Wait

    # Clean up the installer
    Remove-Item -Path $INSTALLER_PATH
}

# Enable model runner and pull model
& "C:\Program Files\Docker\Docker\Docker Desktop.exe" enable model-runner --tcp 12434
docker model pull ai/phi4:latest
