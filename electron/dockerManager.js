const { checkDocker } = require('./dockerUtils');
const { showNotification } = require('./notificationManager');

async function handleDocker() {
  try {
    // Check if Docker is installed
    const dockerAvailable = await checkDocker();
    if (!dockerAvailable) {
      showNotification('Docker not found!', 'Please install Docker Desktop or Engine to use this application');
      return { success: false, message: 'Docker not installed' };
    }

    showNotification('Docker Status', 'Docker is available');
    return { success: true, message: 'Docker is ready' };
  } catch (error) {
    console.error('Docker check failed:', error);
    return { success: false, message: error.message };
  }
}

module.exports = { handleDocker };