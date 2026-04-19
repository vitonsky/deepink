type Callback<T> = () => Promise<T>;

export class DebouncedPromises<T extends unknown> {
	private call: Promise<T> | null = null;
	private nextCall: Callback<T> | null = null;
	private run(callback: Callback<T>) {
		const promise = callback();

		this.call = promise;
		promise.finally(() => {
			if (this.call === promise) {
				this.call = null;
			}
		});

		return promise;
	}

	public add(callback: Callback<T>) {
		if (this.call) {
			this.nextCall = callback;

			const call = this.call;
			return new Promise(async (resolve, reject) => {
				const [result] = await Promise.allSettled([call]);

				if (this.nextCall === callback) {
					this.nextCall = null;
					return this.run(callback).then(resolve, reject);
				}

				if (result.status === 'fulfilled') resolve(result.value);
				else reject(result.reason);
			});
		}

		return this.run(callback);
	}
}
