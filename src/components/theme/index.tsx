import { basicTheme } from './basic';
import { blackberryTheme } from './blackberry';
import { zenTheme } from './zen';

const themes: Record<string, Record<string, any>> = {
	zen: zenTheme,
	light: basicTheme,
	blackberry: blackberryTheme,
};

const themeName = localStorage.getItem('theme') || 'zen';
export const theme = themes[themeName] || zenTheme;
