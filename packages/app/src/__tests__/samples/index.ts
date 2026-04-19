import { readFileSync } from 'fs';
import path from 'path';

export const getLongText = () =>
	readFileSync(path.join(__dirname, 'long-text.md'), {
		encoding: 'utf8',
	});
