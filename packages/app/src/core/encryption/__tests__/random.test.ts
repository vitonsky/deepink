import { createFakeRandomBytesGenerator, mulberry32 } from './random';

describe('Fake random', () => {
	test('mulberry32 sequence', () => {
		const seq1 = mulberry32(0);
		expect(
			Array(10)
				.values()
				.map(() => seq1())
				.toArray(),
		).toMatchSnapshot('Seed 0');

		const seq2 = mulberry32(1);
		expect(
			Array(10)
				.values()
				.map(() => seq2())
				.toArray(),
		).toMatchSnapshot('Seed 1');
	});

	test('random bytes sequence', () => {
		expect(
			Buffer.from(createFakeRandomBytesGenerator(0)(10)).toString('hex'),
		).toMatchSnapshot('Seed 0');
		expect(
			Buffer.from(createFakeRandomBytesGenerator(1)(10)).toString('hex'),
		).toMatchSnapshot('Seed 1');
		expect(
			Buffer.from(createFakeRandomBytesGenerator(100)(10)).toString('hex'),
		).toMatchSnapshot('Seed 100');
	});

	test('fake random bytes can reach the bounds', () => {
		const sample = createFakeRandomBytesGenerator(1)(4096);
		expect(Math.max(...sample)).toBe(255);
		expect(Math.min(...sample)).toBe(0);
	});
});
