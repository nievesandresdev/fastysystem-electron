import { app, BrowserWindow, ipcMain } from 'electron';
import 'dotenv/config';
import path from 'node:path';
import keytar from 'keytar';

const SERVICE = 'fastysystem';
const ACCOUNT = 'auth';
const FRONTEND_URL = process.env.VITE_UI_URL ?? 'http://localhost:5000';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL(FRONTEND_URL);
}

app.whenReady().then(() => {
  // IPC para el token
  ipcMain.handle('auth:setToken', async (_e, token: unknown) => {
    if (typeof token !== 'string' || !token) throw new Error('TOKEN_INVALID');
    await keytar.setPassword(SERVICE, ACCOUNT, token);
    return true;
  });

  ipcMain.handle('auth:getToken', async () => {
    return (await keytar.getPassword(SERVICE, ACCOUNT)) ?? null;
  });

  ipcMain.handle('auth:clear', async () => {
    return keytar.deletePassword(SERVICE, ACCOUNT); // boolean
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
