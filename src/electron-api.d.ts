// src/electron-api.d.ts
export interface ElectronAPI {
  ipcRenderer: {
    send(channel: string, data?: any): void;
    sendSync(channel: string, data?: any): any; // Ensure sendSync is always defined
    on(channel: string, listener: (event: any, data: any) => void): void;
    openNewWindow(): void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
