import { z } from 'zod';

import { IFileController } from '../files';

export class StateFile<T extends z.ZodType, D extends z.TypeOf<T> | void> {
	constructor(
		private readonly file: IFileController,
		private readonly scheme: T,
		private readonly config: {
			defaultValue?: D;
		} = {},
	) {}

	async get(
		options: { onError?: (error: unknown) => void } = {},
	): Promise<void extends D ? z.TypeOf<T> | null : z.TypeOf<T>> {
		const { defaultValue = null } = this.config;

		// Parse data in state file
		const rawJson = await this.file.get();
		if (!rawJson)
			return defaultValue as void extends D ? z.TypeOf<T> | null : z.TypeOf<T>;

		try {
			const parseResult = this.scheme.safeParse(
				JSON.parse(new TextDecoder().decode(rawJson)),
			);
			if (parseResult.success) return parseResult.data;
		} catch (error) {
			if (options.onError) options.onError(error);
		}

		return defaultValue as void extends D ? z.TypeOf<T> | null : z.TypeOf<T>;
	}

	async set(value: z.TypeOf<T>): Promise<void> {
		const validValue = this.scheme.parse(value);

		await this.file.write(
			new TextEncoder().encode(JSON.stringify(validValue)).buffer,
		);
	}

	async clean(): Promise<void> {
		await this.file.delete();
	}
}
