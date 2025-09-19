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
const ACCOUNT = 'auth';
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
        await keytar_1.default.setPassword(SERVICE, ACCOUNT, token);
        return true;
    });
    electron_1.ipcMain.handle('auth:getToken', async () => {
        return (await keytar_1.default.getPassword(SERVICE, ACCOUNT)) ?? null;
    });
    electron_1.ipcMain.handle('auth:clear', async () => {
        return keytar_1.default.deletePassword(SERVICE, ACCOUNT); // boolean
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
