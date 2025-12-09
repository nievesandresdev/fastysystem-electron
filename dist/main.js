"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
require("dotenv/config");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const keytar_1 = __importDefault(require("keytar"));
const SERVICE = 'fastysystem';
const ACCOUNT_TOKEN = 'auth';
const ACCOUNT_USER_ROLES = 'userRoles';
const ACCOUNT_USER = 'user';
// Detectar modo desarrollo: si no está empaquetado o si NODE_ENV es development
const isDevelopment = !electron_1.app.isPackaged || process.env.NODE_ENV === 'development';
// En desarrollo usar puerto 5273 (Vite dev server), en producción usar 5000 (preview)
const FRONTEND_URL = process.env.VITE_UI_URL ?? (isDevelopment ? 'http://localhost:5273' : 'http://localhost:5000');
if (isDevelopment) {
    console.log('🔧 [Electron] Modo desarrollo detectado');
    console.log('🔧 [Electron] Frontend URL:', FRONTEND_URL);
}
// Función para verificar si el frontend está disponible
async function waitForFrontend(maxRetries = 80, delay = 1000) {
    const http = await Promise.resolve().then(() => __importStar(require('http')));
    for (let i = 0; i < maxRetries; i++) {
        try {
            const url = new URL(FRONTEND_URL);
            const isReady = await new Promise((resolve) => {
                const req = http.request({
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    path: url.pathname || '/',
                    method: 'GET',
                    timeout: 5000, // Aumentar timeout a 5 segundos
                    headers: {
                        'User-Agent': 'FastySystem-Electron'
                    }
                }, (res) => {
                    // Aceptar cualquier código de estado 2xx o 3xx como válido
                    const isValid = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 400;
                    resolve(isValid);
                });
                req.on('error', () => resolve(false));
                req.on('timeout', () => {
                    req.destroy();
                    resolve(false);
                });
                req.end();
            });
            if (isReady) {
                console.log(`✅ Frontend disponible en ${FRONTEND_URL}`);
                // Esperar un momento adicional para asegurar que está completamente listo
                // Esto es importante para que el backend también esté completamente inicializado
                await new Promise(resolve => setTimeout(resolve, 2000));
                return true;
            }
        }
        catch (error) {
            // Ignorar errores y seguir intentando
        }
        if (i % 10 === 0) { // Solo mostrar cada 10 intentos para no saturar
            console.log(`⏳ Esperando frontend... (intento ${i + 1}/${maxRetries})`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
}
function createWindow() {
    // Ruta del icono - buscar en diferentes ubicaciones posibles
    let iconPath;
    if (electron_1.app.isPackaged) {
        // Cuando está empaquetado, el icono está en la carpeta de instalación
        // process.resourcesPath apunta a resources/ en la app empaquetada
        // Necesitamos ir a la raíz de la instalación
        const appPath = electron_1.app.getAppPath();
        iconPath = node_path_1.default.join(appPath, '..', 'frontend', 'public', 'img', 'fasty_logo.ico');
        // Si no se encuentra ahí, intentar con process.resourcesPath
        if (!node_fs_1.default.existsSync(iconPath)) {
            iconPath = node_path_1.default.join(process.resourcesPath, '..', 'frontend', 'public', 'img', 'fasty_logo.ico');
        }
    }
    else {
        // En desarrollo, buscar en la estructura del proyecto
        iconPath = node_path_1.default.join(__dirname, '..', '..', 'frontend', 'public', 'img', 'fasty_logo.ico');
    }
    // Verificar si el icono existe, si no, usar el por defecto
    const icon = node_fs_1.default.existsSync(iconPath) ? iconPath : undefined;
    if (icon) {
        console.log(`✅ Icono encontrado: ${icon}`);
    }
    else {
        console.warn(`⚠️ Icono no encontrado en: ${iconPath}`);
    }
    const win = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        icon: icon, // Configurar el icono de la aplicación
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false, // Permitir cargar desde localhost
        },
        show: true, // Mostrar inmediatamente con pantalla de carga
        backgroundColor: '#ffffff', // Fondo blanco mientras carga
    });
    // Cargar pantalla de carga inmediatamente
    win.loadURL(`data:text/html;charset=utf-8,
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>FastySystem - Cargando...</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
          }
          .container {
            text-align: center;
            background: white;
            padding: 60px 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 90%;
          }
          .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
            background: linear-gradient(135deg, #F4A261 0%, #0A9396 50%, #005F73 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: bold;
            color: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          h1 {
            font-size: 32px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #F4A261 0%, #0A9396 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0A9396;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 30px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .status {
            margin-top: 20px;
            color: #666;
            font-size: 16px;
          }
          .dots {
            display: inline-block;
            animation: dots 1.5s steps(4, end) infinite;
          }
          @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">FS</div>
          <h1>FastySystem</h1>
          <div class="spinner"></div>
          <div class="status">Iniciando sistema<span class="dots"></span></div>
        </div>
        <script>
          let statusText = 'Iniciando sistema';
          const statusEl = document.querySelector('.status');
          const steps = [
            'Verificando servicios',
            'Conectando con backend',
            'Conectando con frontend',
            'Cargando aplicación'
          ];
          let stepIndex = 0;
          
          const updateStatus = () => {
            if (stepIndex < steps.length) {
              statusEl.innerHTML = steps[stepIndex] + '<span class="dots"></span>';
              stepIndex++;
              setTimeout(updateStatus, 2000);
            }
          };
          setTimeout(updateStatus, 1000);
        </script>
      </body>
    </html>
  `);
    // Manejar errores de carga
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`❌ Error cargando ${validatedURL}: ${errorCode} - ${errorDescription}`);
        win.loadURL(`data:text/html;charset=utf-8,
      <html>
        <head><title>Error - FastySystem</title></head>
        <body style="font-family: Arial; padding: 20px; text-align: center;">
          <h1>❌ Error al cargar la aplicación</h1>
          <p><strong>Código:</strong> ${errorCode}</p>
          <p><strong>Descripción:</strong> ${errorDescription}</p>
          <p><strong>URL:</strong> ${validatedURL}</p>
          <hr>
          <h2>Posibles soluciones:</h2>
          <ul style="text-align: left; max-width: 600px; margin: 0 auto;">
            <li>Verifica que el frontend esté corriendo en <strong>${FRONTEND_URL}</strong></li>
            <li>Verifica que el backend esté corriendo en <strong>http://localhost:3000</strong></li>
            <li>Revisa las ventanas de consola del backend y frontend</li>
            <li>Intenta abrir <a href="${FRONTEND_URL}" target="_blank">${FRONTEND_URL}</a> en tu navegador</li>
          </ul>
        </body>
      </html>
    `);
        win.show();
    });
    // Mostrar la ventana cuando esté lista (ya está visible con la pantalla de carga)
    win.webContents.on('did-finish-load', () => {
        console.log('✅ Página cargada correctamente');
        // La ventana ya está visible, no necesitamos win.show()
    });
    // Esperar a que el frontend esté disponible antes de cargar
    waitForFrontend().then((isReady) => {
        if (isReady) {
            console.log(`🌐 Cargando ${FRONTEND_URL}...`);
            // Intentar cargar con manejo de errores mejorado
            win.loadURL(FRONTEND_URL).catch((error) => {
                console.error('Error cargando URL:', error);
                // Reintentar una vez más después de un breve delay
                setTimeout(() => {
                    win.loadURL(FRONTEND_URL).catch((retryError) => {
                        console.error('Error en reintento:', retryError);
                        win.loadURL(`data:text/html;charset=utf-8,
              <html>
                <head><title>Error - FastySystem</title></head>
                <body style="font-family: Arial; padding: 20px; text-align: center;">
                  <h1>❌ Error al cargar la aplicación</h1>
                  <p><strong>Código:</strong> -3</p>
                  <p><strong>Descripción:</strong> No se pudo conectar con el frontend</p>
                  <p><strong>URL:</strong> ${FRONTEND_URL}</p>
                  <hr>
                  <h2>Posibles soluciones:</h2>
                  <ul style="text-align: left; max-width: 600px; margin: 0 auto;">
                    <li>Verifica que el frontend esté corriendo en <strong>${FRONTEND_URL}</strong></li>
                    <li>Verifica que el backend esté corriendo en <strong>http://localhost:3000</strong></li>
                    <li>Revisa los logs en la carpeta de instalación</li>
                    <li>Intenta cerrar y abrir la aplicación nuevamente</li>
                    <li>Intenta abrir <a href="${FRONTEND_URL}" target="_blank">${FRONTEND_URL}</a> en tu navegador</li>
                  </ul>
                </body>
              </html>
            `);
                    });
                }, 1000);
            });
        }
        else {
            console.error(`❌ Frontend no disponible después de ${60} intentos`);
            win.loadURL(`data:text/html;charset=utf-8,
        <html>
          <head><title>Error - FastySystem</title></head>
          <body style="font-family: Arial; padding: 20px; text-align: center;">
            <h1>❌ Frontend no disponible</h1>
            <p>No se pudo conectar con el frontend en <strong>${FRONTEND_URL}</strong></p>
            <hr>
            <h2>Verifica:</h2>
            <ul style="text-align: left; max-width: 600px; margin: 0 auto;">
              <li>Que el frontend esté corriendo</li>
              <li>Que el puerto 5000 no esté ocupado</li>
              <li>Revisa los logs en la carpeta de instalación</li>
              <li>Intenta cerrar y abrir la aplicación nuevamente</li>
            </ul>
            <p><a href="${FRONTEND_URL}" target="_blank">Intentar abrir en navegador</a></p>
          </body>
        </html>
      `);
            win.show();
        }
    });
}
electron_1.app.whenReady().then(() => {
    // IPC para el token
    electron_1.ipcMain.handle('auth:setToken', async (_e, token) => {
        if (typeof token !== 'string' || !token)
            throw new Error('TOKEN_INVALID');
        await keytar_1.default.setPassword(SERVICE, ACCOUNT_TOKEN, token);
        return true;
    });
    electron_1.ipcMain.handle('auth:getToken', async () => {
        return (await keytar_1.default.getPassword(SERVICE, ACCOUNT_TOKEN)) ?? null;
    });
    // IPC para los roles del usuario
    electron_1.ipcMain.handle('auth:setUserRoles', async (_e, roles) => {
        if (!Array.isArray(roles))
            throw new Error('ROLES_INVALID');
        const rolesJson = JSON.stringify(roles);
        await keytar_1.default.setPassword(SERVICE, ACCOUNT_USER_ROLES, rolesJson);
        return true;
    });
    electron_1.ipcMain.handle('auth:getUserRoles', async () => {
        const rolesJson = await keytar_1.default.getPassword(SERVICE, ACCOUNT_USER_ROLES);
        if (!rolesJson)
            return [];
        try {
            return JSON.parse(rolesJson);
        }
        catch {
            return [];
        }
    });
    // IPC para la información del usuario
    electron_1.ipcMain.handle('auth:setUser', async (_e, user) => {
        if (!user || typeof user !== 'object')
            throw new Error('USER_INVALID');
        const userJson = JSON.stringify(user);
        await keytar_1.default.setPassword(SERVICE, ACCOUNT_USER, userJson);
        return true;
    });
    electron_1.ipcMain.handle('auth:getUser', async () => {
        const userJson = await keytar_1.default.getPassword(SERVICE, ACCOUNT_USER);
        if (!userJson)
            return null;
        try {
            return JSON.parse(userJson);
        }
        catch {
            return null;
        }
    });
    // IPC para limpiar todos los datos
    electron_1.ipcMain.handle('auth:clear', async () => {
        await Promise.all([
            keytar_1.default.deletePassword(SERVICE, ACCOUNT_TOKEN),
            keytar_1.default.deletePassword(SERVICE, ACCOUNT_USER_ROLES),
            keytar_1.default.deletePassword(SERVICE, ACCOUNT_USER),
        ]);
        return true;
    });
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Cerrar todos los procesos relacionados antes de salir
        // Esto ayuda a evitar conflictos al reabrir la app
        electron_1.app.quit();
    }
});
// Manejar cierre de la aplicación
electron_1.app.on('before-quit', () => {
    // Asegurar que todas las ventanas se cierren correctamente
    const windows = electron_1.BrowserWindow.getAllWindows();
    windows.forEach(win => {
        if (!win.isDestroyed()) {
            win.destroy();
        }
    });
});
