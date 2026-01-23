import { contextBridge } from 'electron';
import { initZoomFactor } from '@utils/os/zoom';

initZoomFactor();

contextBridge.exposeInMainWorld('getEnvVersions', () => process.versions);
