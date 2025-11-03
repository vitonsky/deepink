import { Configuration } from 'webpack';

import app from './scripts/webpack/app';
import electronMain from './scripts/webpack/electron-main';
import electronPreload from './scripts/webpack/electron-preload';

export default [electronMain, electronPreload, app] satisfies Configuration[];
