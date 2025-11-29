"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('authVault', {
    setToken: (t) => electron_1.ipcRenderer.invoke('auth:setToken', t),
    getToken: () => electron_1.ipcRenderer.invoke('auth:getToken'),
    clear: () => electron_1.ipcRenderer.invoke('auth:clear'),
    getUserRoles: () => electron_1.ipcRenderer.invoke('auth:getUserRoles'),
    setUserRoles: (roles) => electron_1.ipcRenderer.invoke('auth:setUserRoles', roles),
    getUser: () => electron_1.ipcRenderer.invoke('auth:getUser'),
    setUser: (user) => electron_1.ipcRenderer.invoke('auth:setUser', user),
});
