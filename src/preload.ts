import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('authVault', {
  setToken: (t: string) => ipcRenderer.invoke('auth:setToken', t),
  getToken: () => ipcRenderer.invoke('auth:getToken'),
  clear: () => ipcRenderer.invoke('auth:clear'),
});
