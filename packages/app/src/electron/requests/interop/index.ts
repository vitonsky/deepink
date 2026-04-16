import { IFontInfo } from 'font-list';

import { createChannel } from '../../utils/ipc';

/**
 * Channel for general interop with OS
 */
export const interopChannel = createChannel<{
	getFontsList(): Promise<IFontInfo[]>;
	getAppLanguage(): Promise<string>;
	setAppLanguage(language: string): Promise<void>;
}>({ name: 'os-interop' });
