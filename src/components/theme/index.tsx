import { extendTheme } from '@chakra-ui/react';

import baseTheme from './base';
import lightTheme from './color-schemes/generic/light';
import monochromeTheme from './color-schemes/monochrome';
import zenTheme from './color-schemes/zen';

const themes: Record<string, Record<string, any>> = {
	generic: extendTheme(
		baseTheme,
		// styles: lightTheme('#000000ff');
		// styles: lightTheme('#ffa600ff');
		// styles: lightTheme('#f400ff');
		// styles: lightTheme('#0066ff');
		// styles: lightTheme('#ffb107ff');
		lightTheme('#f400ff'),
	),
	zen: extendTheme(baseTheme, zenTheme),
	monochrome: extendTheme(baseTheme, monochromeTheme),
};

const themeName = localStorage.getItem('theme') || 'generic';
export const theme = themes[themeName] || zenTheme;
