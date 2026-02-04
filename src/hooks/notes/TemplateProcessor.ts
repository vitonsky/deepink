import dayjs from 'dayjs';

type Token = { type: 'text'; value: string } | { type: 'directive'; value: string };

export class TemplateProcessor {
	constructor(
		private readonly config: {
			ignoreParsingErrors?: boolean;
		} = {},
	) {}

	public compile(template: string) {
		return this.tokenize(template)
			.map((token) => {
				if (token.type === 'text') return token.value;

				const directive = token.value.trim();
				if (directive.startsWith('date:') || directive === 'date') {
					const format = directive.startsWith('date:')
						? directive.slice('date:'.length)
						: 'DD/MM/YYYY';
					return dayjs().format(format);
				}

				return `{${token.value}}`;
			})
			.join('');
	}

	public tokenize(input: string): Token[] {
		const { ignoreParsingErrors = false } = this.config;

		const tokens: Token[] = [];
		let buffer = '';
		let i = 0;

		while (i < input.length) {
			const char = input[i];

			if (char === '{') {
				if (buffer) {
					tokens.push({ type: 'text', value: buffer });
					buffer = '';
				}

				i++;
				let directive = '';

				while (i < input.length && input[i] !== '}') {
					directive += input[i];
					i++;
				}

				if (input[i] !== '}') {
					if (ignoreParsingErrors) {
						tokens.push({ type: 'text', value: '{' + directive });

						i++;
						continue;
					}

					throw new Error('Unclosed directive');
				}

				tokens.push({ type: 'directive', value: directive });
			} else {
				buffer += char;
			}

			i++;
		}

		if (buffer) {
			tokens.push({ type: 'text', value: buffer });
		}

		return tokens;
	}
}
