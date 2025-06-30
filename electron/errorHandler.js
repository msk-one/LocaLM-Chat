const { dialog, app } = require('electron');

function handleErrors(error) {
  console.error('Application error:', error);
  
  let message = 'An unexpected error occurred';
  let detail = error.message || error.toString();
  
  if (error.message.includes('Unsupported CPU') ||
      error.message.includes('NVIDIA RTX') ||
      error.message.includes('Apple Silicon')) {
    message = 'Hardware Requirements Not Met';
    detail += '\n\nThis application requires:\n';
    detail += '- Apple Silicon (M1/M2/M3/M4) on macOS\n';
    detail += '- NVIDIA RTX GPU on Windows\n';
    detail += '- 16GB RAM minimum';
  }
  
  // Show error dialog
  dialog.showErrorBox(message, detail);
  
  // Quit app after showing error
  if (app && app.quit) {
    app.quit();
  }
}

function showErrorDialog(title, message) {
  return dialog.showMessageBox({
    type: 'error',
    title: title || 'Error',
    message: message || 'An unexpected error occurred',
    buttons: ['OK']
  });
}

module.exports = { handleErrors, showErrorDialog };