import { IFontInfo } from 'font-list';

import { createChannel } from '../../utils/ipc';

/**
 * Channel for general interop with OS
 */
export const interopChannel = createChannel<{
	getFontsList(): Promise<IFontInfo[]>;
}>({ name: 'os-interop' });
