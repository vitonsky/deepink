const { readFileSync } = require('fs');

/**
 * Jest transformer that returns source as UTF-8 string
 */
module.exports = {
	process(sourceText, sourcePath, options) {
		const content = readFileSync(sourcePath, 'utf8');

		return {
			code: `module.exports = ${JSON.stringify(content)};`,
		};
	},
};