import { getRelativePath, getResolvedPath } from './paths';

describe('getResolvedPath', () => {
	test('resolves .. up levels from file base', () => {
		expect(getResolvedPath('../../x', '/foo/bar/baz')).toBe('/foo/x');
	});

	test('returns absolute rel as-is (normalized)', () => {
		expect(getResolvedPath('/x', '/foo/bar')).toBe('/x');
		expect(getResolvedPath('/a//b///c', '/anything')).toBe('/a/b/c');
		expect(getResolvedPath('/a/b/../c', '/anything')).toBe('/a/c');
		expect(getResolvedPath('/a/b/.././x/.././c', '/anything')).toBe('/a/c');
	});

	test('treats base with trailing slash as directory', () => {
		expect(getResolvedPath('./y', '/foo/bar/baz/')).toBe('/foo/bar/baz/y');
		expect(getResolvedPath('..', '/foo/bar/baz/')).toBe('/foo/bar');
	});

	test("collapses duplicate slashes and handles '.'", () => {
		expect(getResolvedPath('././x', '/foo//bar///')).toBe('/foo/bar/x');
		expect(getResolvedPath('a/./b', '/')).toBe('/a/b');
	});

	test("doesn't go above root", () => {
		expect(getResolvedPath('../../..', '/a/b')).toBe('/');
		expect(getResolvedPath('..', '/')).toBe('/');
	});

	test('handles single-segment relative and trailing slashes', () => {
		expect(getResolvedPath('z/', '/foo/bar')).toBe('/foo/bar/z');
	});

	test('preserves segments with dots in names', () => {
		expect(getResolvedPath('../file.name.ext', '/a/b/c')).toBe('/a/b/file.name.ext');
	});

	test('throws when base is not absolute', () => {
		// The implementation throws Error for non-absolute base
		expect(() => getResolvedPath('x', 'relative/base')).toThrow();
	});
});

describe('getRelativePath', () => {
	test('basic cases resolution', () => {
		expect(getRelativePath('/', '/')).toBe('.');
		expect(getRelativePath('/foo', '/foo')).toBe('.');
		expect(getRelativePath('/foo/bar/baz', '/foo/bar/baz')).toBe('.');

		expect(getRelativePath('/foo/bar/baz', '/foo/bar')).toBe('./baz');
		expect(getRelativePath('/foo/bar/baz/1/2/3', '/foo/bar')).toBe('./baz/1/2/3');

		expect(getRelativePath('/foo/bar', '/foo/bar/baz')).toBe('..');
		expect(getRelativePath('/foo/bar/x', '/foo/bar/baz')).toBe('../x');
		expect(getRelativePath('/foo/bar/x/y/z', '/foo/bar/baz')).toBe('../x/y/z');
	});

	test('multi levels resolution', () => {
		expect(getRelativePath('/foo/bar/x/y/z', '/foo/bar/baz')).toBe('../x/y/z');
		expect(getRelativePath('/foo/bar', '/foo/bar/x/y/z')).toBe('../../..');
		expect(getRelativePath('/foo/bar/1/2/3', '/foo/bar/x/y/z')).toBe(
			'../../../1/2/3',
		);
	});

	test('paths must be normalized', () => {
		expect(getRelativePath('///', '/')).toBe('.');
		expect(getRelativePath('/', '////')).toBe('.');

		expect(getRelativePath('///foo//////bar/x', '/foo/bar/baz')).toBe('../x');
	});
});
