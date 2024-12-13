export class RawValue {
	protected readonly value;
	constructor(value: string | number) {
		this.value = value;
	}

	public getValue = () => {
		return this.value;
	};
}
