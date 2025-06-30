const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function checkDocker() {
  try {
    const { stdout } = await execAsync('docker --version');
    console.log('Docker version:', stdout.trim());
    return true;
  } catch (error) {
    console.log('Docker not found:', error.message);
    return false;
  }
}

async function checkDockerCompose() {
  try {
    const { stdout } = await execAsync('docker-compose --version');
    console.log('Docker Compose version:', stdout.trim());
    return true;
  } catch (error) {
    console.log('Docker Compose not found:', error.message);
    return false;
  }
}

async function getDockerInfo() {
  try {
    const { stdout } = await execAsync('docker info --format "{{json .}}"');
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Failed to get Docker info:', error);
    return null;
  }
}

async function isDockerRunning() {
  try {
    await execAsync('docker ps');
    return true;
  } catch (error) {
    console.log('Docker daemon not running:', error.message);
    return false;
  }
}

module.exports = {
  checkDocker,
  checkDockerCompose,
  getDockerInfo,
  isDockerRunning
};