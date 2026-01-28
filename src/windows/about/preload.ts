import { contextBridge } from 'electron';
import { exposeElectronPatches } from '@electron/requests/electronPatches/preload';
import { initZoomFactor } from '@utils/os/zoom';

initZoomFactor();
exposeElectronPatches();

contextBridge.exposeInMainWorld('getEnvVersions', () => process.versions);
