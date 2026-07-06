import { wait } from '@utils/time';

import { createSyncContext } from './createSyncContext';

test('Default value can be used anywhere', () => {
	const ctx = createSyncContext(1);
	expect(ctx.get()).toBe(1);
});

test('Overridden value can be accessed inside context', () => {
	const ctx = createSyncContext(1);

	expect.assertions(1);
	ctx.use(2, () => {
		expect(ctx.get()).toBe(2);
	});
});

test('The nearest value must be accessible inside context', () => {
	expect.assertions(3);

	const ctx = createSyncContext(1);
	ctx.use(2, () => {
		ctx.use(3, () => {
			expect(ctx.get()).toBe(3);

			ctx.use(4, () => {
				ctx.use(5, () => {
					expect(ctx.get()).toBe(5);
				});
			});

			expect(ctx.get()).toBe(3);
		});
	});
});

test('Context use can return value', () => {
	const ctx = createSyncContext(1);
	expect(
		ctx.use(2, () => 'test'),
		'Callback may return any value',
	).toBe('test');

	expect(
		ctx.use(2, () => ctx.use(3, () => ctx.use(4, () => ctx.get()))),
		'Callback may return its context value',
	).toBe(4);
});

test('Async code may access context via closure', async () => {
	const ctx = createSyncContext(1);

	const getValue = () => {
		const value = ctx.get();

		return (async () => {
			await wait(10);
			return value;
		})();
	};

	await expect(ctx.use(2, () => getValue())).resolves.toBe(2);
});
