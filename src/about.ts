import packageInfo from '../package.json';

export const getAbout = () => {
	const { version, name, description, author, license, homepage, bugs } = packageInfo;

	return {
		displayName: 'Deepink',
		name,
		description,
		version,
		author,
		license,
		homepage,
		bugs: bugs.url,
	};
};
