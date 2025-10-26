import os from 'os';

export const getPlatform = () => os.platform();
export const isPlatform = (platformName: ReturnType<typeof getPlatform>) =>
	os.platform() === platformName;
