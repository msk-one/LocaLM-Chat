const { exec } = require('child_process');
const { dialog } = require('electron');
const path = require('path');

const installDocker = () => {
  const isWindows = process.platform === 'win32';
  const scriptPath = isWindows
    ? path.join(__dirname, 'install-docker.ps1')
    : path.join(__dirname, 'install-docker.sh');

  const command = isWindows ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}"` : `sh ${scriptPath}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      dialog.showErrorBox('Error installing Docker', stderr);
      return;
    }

    dialog.showinfoBox({
      title: 'Docker Installation',
      message: stdout,
    });
  });
};

module.exports = { installDocker };
