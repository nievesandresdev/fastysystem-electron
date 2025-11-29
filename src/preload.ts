import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('authVault', {
  setToken: (t: string) => ipcRenderer.invoke('auth:setToken', t),
  getToken: () => ipcRenderer.invoke('auth:getToken'),
  clear: () => ipcRenderer.invoke('auth:clear'),
  getUserRoles: () => ipcRenderer.invoke('auth:getUserRoles'),
  setUserRoles: (roles: string[]) => ipcRenderer.invoke('auth:setUserRoles', roles),
  getUser: () => ipcRenderer.invoke('auth:getUser'),
  setUser: (user: any) => ipcRenderer.invoke('auth:setUser', user),
});
