type Config = Record<string, any>;

export class ConfigStorage<T extends Record<string, any> = Config> {
	public async set(key: string, value: T[keyof T]) {
		self.localStorage.setItem(key, JSON.stringify(value));
	}

	public async get(key: string) {
		const value = self.localStorage.getItem(key);
		return value === null ? null : JSON.parse(value);
	}
}
