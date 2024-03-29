const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const isProduction = mode === 'production';

const isFastBuild = !isProduction && process.env.FAST_BUILD === 'on';

module.exports = {
	mode,
	isProduction,
	isFastBuild,
};
