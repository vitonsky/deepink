require('blob-polyfill');

export const createTextFile = (text: string): File =>
	new File([text], 'test.txt', { type: 'text/plain' });
