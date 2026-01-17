import { basicTheme } from './basic';
import monochromeTheme from './monochrome';
import zenTheme from './zen';

const themes: Record<string, Record<string, any>> = {
	zen: zenTheme,
	light: basicTheme,
	monochrome: monochromeTheme,
};

const themeName = localStorage.getItem('theme') || 'light';
export const theme = themes[themeName] || zenTheme;
