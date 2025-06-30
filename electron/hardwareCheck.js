const si = require('systeminformation');

async function checkHardware() {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // Check for Apple Silicon
    const cpu = await si.cpu();
    if (cpu.manufacturer.includes('Intel')) {
      throw new Error('This application requires Apple Silicon (M1+) and does not support Intel processors');
    }
  } else if (platform === 'win32') {
    // Check for NVIDIA RTX GPU
    const gpu = await si.graphics();
    const hasRTX = gpu.controllers.some(controller => 
      controller.model.match(/RTX/)
    );
    
    if (!hasRTX) {
      throw new Error('This application requires an NVIDIA RTX GPU for acceleration');
    }
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

module.exports = { checkHardware };