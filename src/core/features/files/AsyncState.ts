export interface AsyncState<T, D = null> {
	get(): Promise<T | D>;
	set(value: T): Promise<void>;
	clean(): Promise<void>;
}
