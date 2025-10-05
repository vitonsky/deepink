// Run only in browser-like env
const isDOMLikeEnv = typeof window !== 'undefined' && typeof document !== 'undefined';
if (isDOMLikeEnv) {
	require('@testing-library/jest-dom');
	require('blob-polyfill');
}
