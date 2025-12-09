const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const electronDir = __dirname.replace(/\\scripts$/, '').replace(/\/scripts$/, '');
const distPath = path.join(electronDir, 'dist', 'main.js');
const nodeModulesPath = path.join(electronDir, 'node_modules');

// Verificar que node_modules existe
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ Error: node_modules no encontrado. Ejecuta "npm install" primero.');
  process.exit(1);
}

// Verificar que está compilado
if (!fs.existsSync(distPath)) {
  console.log('🔨 Electron no está compilado. Compilando...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: electronDir,
    shell: true,
    stdio: 'inherit'
  });

  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Error compilando electron');
      process.exit(1);
    }
    startElectron();
  });
} else {
  startElectron();
}

function startElectron() {
  // NO mostrar logs en consola - Electron debe abrirse silenciosamente
  // La pantalla de carga se mostrará en la ventana de Electron
  
  // Buscar electron en node_modules
  const electronPath = path.join(nodeModulesPath, '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');
  
  let electronProcess;
  
  if (fs.existsSync(electronPath)) {
    // Para rutas con espacios en Windows, usar shell: true con comillas
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      // En Windows, usar shell: true con comillas para rutas con espacios
      const command = `"${electronPath}" .`;
      electronProcess = spawn(command, [], {
        cwd: electronDir,
        shell: true,
        stdio: 'ignore', // Ignorar salida para que no aparezcan terminales
        env: { 
          ...process.env, 
          NODE_ENV: 'production',
          VITE_UI_URL: process.env.VITE_UI_URL || 'http://localhost:5000'
        }
      });
    } else {
      // En Linux/Mac, usar spawn normal
      electronProcess = spawn(electronPath, ['.'], {
        cwd: electronDir,
        shell: false,
        stdio: 'ignore',
        env: { 
          ...process.env, 
          NODE_ENV: 'production',
          VITE_UI_URL: process.env.VITE_UI_URL || 'http://localhost:5000'
        }
      });
    }
  } else {
    // Intentar con npx
    electronProcess = spawn('npx', ['--yes', 'electron', '.'], {
      cwd: electronDir,
      shell: true,
      stdio: 'ignore',
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        VITE_UI_URL: process.env.VITE_UI_URL || 'http://localhost:5000'
      }
    });
  }

  electronProcess.on('error', (error) => {
    // Si hay error, mostrar una ventana de error
    const { execSync } = require('child_process');
    try {
      execSync(`msg * "Error iniciando Electron: ${error.message}"`, { shell: true });
    } catch (e) {
      // Ignorar si no se puede mostrar el mensaje
    }
    process.exit(1);
  });

  electronProcess.on('close', (code) => {
    // Si Electron se cierra con error, salir silenciosamente
    // El usuario verá el error en la ventana de Electron
    process.exit(code || 0);
  });

  // Manejar cierre limpio
  process.on('SIGINT', () => {
    if (electronProcess) electronProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    if (electronProcess) electronProcess.kill();
    process.exit(0);
  });
  
  // NO mostrar mensajes - Electron se abre silenciosamente
}

