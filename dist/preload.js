"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('authVault', {
    setToken: (t) => electron_1.ipcRenderer.invoke('auth:setToken', t),
    getToken: () => electron_1.ipcRenderer.invoke('auth:getToken'),
    clear: () => electron_1.ipcRenderer.invoke('auth:clear'),
});
