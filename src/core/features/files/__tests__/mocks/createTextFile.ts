export const File = require('blob-polyfill').File;

export const createTextFile = (text: string): File =>
	new File([Buffer.from(text).buffer], 'test.txt', { type: 'text/txt' });
