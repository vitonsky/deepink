const electron = require('./webpack.electron');
const app = require('./webpack.app');
const preloadScripts = require('./webpack.preload-scripts');

// TODO: group configs into dir
module.exports = [electron, preloadScripts, app];
