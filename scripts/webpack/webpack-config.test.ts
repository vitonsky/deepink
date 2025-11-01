import { getAppWindows } from './utils';

test('All windows and preload scripts must be found', () => {
	expect(getAppWindows()).toMatchSnapshot();
});
