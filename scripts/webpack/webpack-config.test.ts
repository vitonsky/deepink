import path from 'path';

import { getAppWindows, getBuildConfigFiles } from './utils';

test('All windows and preload scripts must be found', () => {
	expect(getAppWindows()).toMatchSnapshot();
});

test('All config files must be found', () => {
	expect(
		getBuildConfigFiles().map((filename) => path.relative(__dirname, filename)),
	).toMatchSnapshot();
});
