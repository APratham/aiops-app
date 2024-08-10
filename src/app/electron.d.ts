// src/electron.d.ts
export interface IElectronAPI {
  ipcRenderer: {
    send(channel: string, data: any): void;
    on(channel: string, listener: (event: any, data: any) => void): void;
  };
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
