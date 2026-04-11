import { uniqueName } from './uniqueName';

describe('uniqueName basic cases', () => {
	const getName = uniqueName<string>(
		(title, uniqueId) => [title, uniqueId].filter(Boolean).join('-') + '.md',
	);

	test('Suffix appends for name collisions', () => {
		expect(getName('foo')).toBe('foo.md');

		expect(getName('foo')).toBe('foo-1.md');
		expect(getName('foo')).toBe('foo-2.md');
		expect(getName('foo')).toBe('foo-3.md');
		expect(getName('foo')).toBe('foo-4.md');
		expect(getName('foo')).toBe('foo-5.md');

		expect(getName('bar')).toBe('bar.md');
		expect(getName('bar')).toBe('bar-1.md');
		expect(getName('bar')).toBe('bar-2.md');
		expect(getName('bar')).toBe('bar-3.md');

		expect(getName('foo')).toBe('foo-6.md');
		expect(getName('foo')).toBe('foo-7.md');
		expect(getName('foo')).toBe('foo-8.md');
		expect(getName('foo')).toBe('foo-9.md');
		expect(getName('foo')).toBe('foo-10.md');
	});

	test('If result name is equal to anything used in session, suffix must be added', () => {
		expect(getName('x')).toBe('x.md');
		expect(getName('y')).toBe('y.md');
		expect(getName('z')).toBe('z.md');

		expect(getName('x')).toBe('x-1.md');
		expect(getName('x-1')).toBe('x-1-1.md');
		expect(getName('x-1')).toBe('x-1-2.md');
		expect(getName('x-1-2')).toBe('x-1-2-1.md');
	});
});

test('In case user function yields too many collisions, name generator throws error', () => {
	const getName = uniqueName<string>(() => 'foo');

	expect(getName('foo')).toBe('foo');
	expect(() => getName('foo')).toThrowError('Too deep recursion');
});
