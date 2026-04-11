import { vol } from 'memfs';
import { getResolvedPath, joinPathSegments } from '@utils/fs/paths';

// Real package uses a system calls, that is not mocked,
// so we mock behaviour of this package
export default async (path: string) => {
	const results = await vol.promises.readdir(path, { recursive: true });
	return (
		results
			.map((foundPath) =>
				joinPathSegments([getResolvedPath(path, '/'), foundPath as string]),
			)
			// Filter out directories and leave only files
			.filter((path) => {
				// Standard `isDirectory` api implemented incorrect,
				// so we manually implement check for directory
				const isDirectory = vol.statSync(path).mode === 16895;
				return !isDirectory;
			})
	);
};
