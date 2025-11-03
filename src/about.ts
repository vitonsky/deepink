import packageInfo from '../package.json';

export const getAbout = () => {
	const { version, name, productName, description, author, license, homepage, bugs } =
		packageInfo;

	return {
		displayName: productName,
		name,
		description,
		version,
		author,
		license,
		homepage,
		bugs: bugs.url,
	};
};
