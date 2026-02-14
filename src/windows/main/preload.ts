import { exposeElectronPatches } from '@electron/requests/electronPatches/preload';
import { initZoomFactor } from '@utils/os/zoom';

initZoomFactor();
exposeElectronPatches();
