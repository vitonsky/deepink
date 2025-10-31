import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('getEnvVersions', () => process.versions);
