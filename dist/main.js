"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
require("dotenv/config");
const node_path_1 = __importDefault(require("node:path"));
const keytar_1 = __importDefault(require("keytar"));
const SERVICE = 'fastysystem';
const ACCOUNT_TOKEN = 'auth';
const ACCOUNT_USER_ROLES = 'userRoles';
const ACCOUNT_USER = 'user';
const FRONTEND_URL = process.env.VITE_UI_URL ?? 'http://localhost:5000';
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    win.loadURL(FRONTEND_URL);
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
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
