import { ClassNameFormatter } from '@bem-react/classname';

export type ClassNameExtensions = Record<string, string | string[]>;
export const extendClassName =
	(
		cn: ClassNameFormatter,
		extensions: ClassNameExtensions,
	): ClassNameFormatter =>
		(...args: any[]) => {
			const className = [cn(...args)];

			const isFirstArgAreElementName = args.length > 0 && typeof args[0] === 'string';
			if (isFirstArgAreElementName) {
				const extensionForElement = extensions[args[0]] ?? [];
				if (typeof extensionForElement === 'string') {
					className.push(extensionForElement);
				} else {
					className.push(...extensionForElement);
				}
			}

			return className.join(' ');
		};