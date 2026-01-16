import { basicTheme } from './basic';
import { zenTheme } from './zen';

const themes: Record<string, Record<string, any>> = {
	zen: zenTheme,
	light: basicTheme,
};

const themeName = localStorage.getItem('theme') || 'zen';
export const theme = themes[themeName] || zenTheme;
