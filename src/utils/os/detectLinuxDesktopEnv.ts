/* eslint-disable @cspell/spellchecker */
import { spawnSync } from 'child_process';

export type DesktopEnv =
	| 'gnome'
	| 'kde'
	| 'xfce'
	| 'cinnamon'
	| 'mate'
	| 'lxqt'
	| 'unknown';

export function detectLinuxDesktopEnv(): DesktopEnv {
	if (process.platform !== 'linux') return 'unknown';

	const env = (
		process.env.XDG_CURRENT_DESKTOP ||
		process.env.DESKTOP_SESSION ||
		process.env.XDG_SESSION_DESKTOP ||
		''
	).toLowerCase();

	if (env.includes('gnome')) return 'gnome';
	if (env.includes('kde')) return 'kde';
	if (env.includes('xfce')) return 'xfce';
	if (env.includes('cinnamon')) return 'cinnamon';
	if (env.includes('mate')) return 'mate';
	if (env.includes('lxqt')) return 'lxqt';

	try {
		const out = spawnSync('ps', ['-eo', 'comm'], {
			encoding: 'utf8',
			timeout: 1500,
		}).stdout.toLowerCase();
		if (out.includes('gnome-shell')) return 'gnome';
		if (out.includes('plasmashell')) return 'kde';
		if (out.includes('xfce4-session')) return 'xfce';
		if (out.includes('cinnamon')) return 'cinnamon';
		if (out.includes('mate-session')) return 'mate';
		if (out.includes('lxqt-session')) return 'lxqt';
	} catch (err) {
		console.error(err);
	}

	return 'unknown';
}
