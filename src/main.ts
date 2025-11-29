import { app, BrowserWindow, ipcMain } from 'electron';
import 'dotenv/config';
import path from 'node:path';
import keytar from 'keytar';

const SERVICE = 'fastysystem';
const ACCOUNT_TOKEN = 'auth';
const ACCOUNT_USER_ROLES = 'userRoles';
const ACCOUNT_USER = 'user';
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
    await keytar.setPassword(SERVICE, ACCOUNT_TOKEN, token);
    return true;
  });

  ipcMain.handle('auth:getToken', async () => {
    return (await keytar.getPassword(SERVICE, ACCOUNT_TOKEN)) ?? null;
  });

  // IPC para los roles del usuario
  ipcMain.handle('auth:setUserRoles', async (_e, roles: unknown) => {
    if (!Array.isArray(roles)) throw new Error('ROLES_INVALID');
    const rolesJson = JSON.stringify(roles);
    await keytar.setPassword(SERVICE, ACCOUNT_USER_ROLES, rolesJson);
    return true;
  });

  ipcMain.handle('auth:getUserRoles', async () => {
    const rolesJson = await keytar.getPassword(SERVICE, ACCOUNT_USER_ROLES);
    if (!rolesJson) return [];
    try {
      return JSON.parse(rolesJson) as string[];
    } catch {
      return [];
    }
  });

  // IPC para la información del usuario
  ipcMain.handle('auth:setUser', async (_e, user: unknown) => {
    if (!user || typeof user !== 'object') throw new Error('USER_INVALID');
    const userJson = JSON.stringify(user);
    await keytar.setPassword(SERVICE, ACCOUNT_USER, userJson);
    return true;
  });

  ipcMain.handle('auth:getUser', async () => {
    const userJson = await keytar.getPassword(SERVICE, ACCOUNT_USER);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  });

  // IPC para limpiar todos los datos
  ipcMain.handle('auth:clear', async () => {
    await Promise.all([
      keytar.deletePassword(SERVICE, ACCOUNT_TOKEN),
      keytar.deletePassword(SERVICE, ACCOUNT_USER_ROLES),
      keytar.deletePassword(SERVICE, ACCOUNT_USER),
    ]);
    return true;
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
