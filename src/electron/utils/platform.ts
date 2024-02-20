const os = require('os');

export const getPlatform = () => os.platform();
export const isPlatform = (platformName: ReturnType<typeof getPlatform>) =>
	os.platform() === platformName;
