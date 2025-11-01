import path from 'path';
import { PathData } from 'webpack';

export const projectRoot = path.resolve('.');

export const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

export const isProduction = mode === 'production';
export const isFastBuild = process.env.FAST_BUILD === 'on';

export const isPreloadChunk = (chunk: Exclude<PathData['chunk'], void>) =>
	Boolean(chunk.name && chunk.name.endsWith('-preload'));
